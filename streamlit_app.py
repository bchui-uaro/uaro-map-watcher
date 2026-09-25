import html
import json
import re
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from urllib.parse import unquote
from zoneinfo import ZoneInfo

import requests
import streamlit as st
from streamlit_local_storage import LocalStorage
from streamlit_autorefresh import st_autorefresh


DEFAULT_MAP_URL = "https://uaro.net/cp/?module=character&action=mapstats"
TIME_UNITS = {"seconds": 1, "minutes": 60, "hours": 3600}
PACIFIC = ZoneInfo("America/Los_Angeles")


class MapTableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_row = False
        self.in_cell = False
        self.cells = []
        self.current_cell = ""
        self.maps = {}

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == "tr":
            self.in_row = True
            self.cells = []
        elif self.in_row and tag in {"td", "th"}:
            self.in_cell = True
            self.current_cell = ""

    def handle_data(self, data):
        if self.in_cell:
            self.current_cell += data

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self.in_cell and tag in {"td", "th"}:
            self.cells.append(" ".join(self.current_cell.split()))
            self.in_cell = False
        elif tag == "tr" and self.in_row:
            self.in_row = False
            if len(self.cells) >= 2:
                map_name = self.cells[0].strip()
                player_match = re.search(r"\d+", self.cells[1])
                if re.fullmatch(r"[A-Za-z0-9_-]+", map_name) and player_match:
                    self.maps[map_name] = int(player_match.group())


def read_secret(name, default=""):
    try:
        return st.secrets.get(name, default)
    except Exception:
        return default


def parse_maps(page):
    parser = MapTableParser()
    parser.feed(page)
    if parser.maps:
        return parser.maps

    text = re.sub(r"<[^>]+>", " ", page)
    text = html.unescape(" ".join(text.split()))
    return {match.group(1): int(match.group(2)) for match in re.finditer(
        r"\b([A-Za-z0-9_-]+)\s+(\d+)\s+player", text, re.IGNORECASE
    )}


def fetch_maps(map_url):
    response = requests.get(
        map_url,
        headers={"User-Agent": "uaRO-map-watcher/1.0"},
        timeout=15,
    )
    response.raise_for_status()
    return parse_maps(response.text)


def send_discord(webhook_url, message):
    if not webhook_url:
        return
    response = requests.post(webhook_url, json={"content": message}, timeout=15)
    response.raise_for_status()


def now_text():
    return datetime.now(PACIFIC).strftime("%Y-%m-%d %I:%M:%S %p %Z")


def next_check_text(seconds):
    return (datetime.now(timezone.utc) + timedelta(seconds=seconds)).astimezone(PACIFIC).strftime(
        "%Y-%m-%d %I:%M:%S %p %Z"
    )


def event_kind(event):
    """Support event records created by older app versions."""
    if event.get("kind"):
        return event["kind"]
    return "below" if event.get("status") in {"empty", "below_threshold"} else "recovered"


PREFERENCES_KEY = "uaro_map_watcher_preferences"


def decode_preferences(raw):
    try:
        data = json.loads(raw)
        watched_maps = [
            name for name in data.get("watched_maps", [])
            if re.fullmatch(r"[A-Za-z0-9_-]+", name)
        ]
        thresholds = {
            name: max(1, int(value))
            for name, value in data.get("thresholds", {}).items()
            if re.fullmatch(r"[A-Za-z0-9_-]+", name)
        }
        return watched_maps, thresholds
    except (TypeError, ValueError, json.JSONDecodeError):
        return None, {}


def load_saved_preferences():
    try:
        # streamlit-local-storage 0.0.25 accepts only the storage key here.
        stored = browser_storage.getItem(PREFERENCES_KEY)
    except Exception:
        stored = None
    if stored not in (None, ""):
        watched_maps, thresholds = decode_preferences(stored)
        if watched_maps is not None:
            return watched_maps, thresholds

    # One-time fallback for users upgrading from the URL-persistence version.
    saved_maps = st.query_params.get("maps")
    if saved_maps is None:
        return None, {}
    watched_maps = [
        name for name in saved_maps.split(",")
        if re.fullmatch(r"[A-Za-z0-9_-]+", name)
    ]
    thresholds = {}
    for item in st.query_params.get("thresholds", "").split(";"):
        if ":" not in item:
            continue
        encoded_name, raw_value = item.rsplit(":", 1)
        name = unquote(encoded_name)
        if re.fullmatch(r"[A-Za-z0-9_-]+", name) and raw_value.isdigit():
            thresholds[name] = max(1, int(raw_value))
    return watched_maps, thresholds


def save_preferences():
    try:
        browser_storage.setItem(
            PREFERENCES_KEY,
            json.dumps({
                "watched_maps": st.session_state.watched_maps,
                "thresholds": st.session_state.thresholds,
            }),
        )
    except Exception:
        # Storage is a convenience; the app should still run if a browser blocks it.
        pass


def check_maps():
    maps = fetch_maps(st.session_state.map_url)
    st.session_state.map_options = sorted(set(st.session_state.map_options) | set(maps))
    timestamp = now_text()
    notifications = []
    for map_name in st.session_state.watched_maps:
        players = maps.get(map_name, 0)
        threshold = max(1, int(st.session_state.thresholds.get(map_name, 1)))
        alerting = players < threshold
        status = "empty" if players == 0 else ("below_threshold" if alerting else "occupied")
        previous = st.session_state.statuses.get(map_name)
        st.session_state.statuses[map_name] = {
            "status": status,
            "players": players,
            "threshold": threshold,
            "alerting": alerting,
            "checked_at": timestamp,
        }
        previous_alerting = None if not previous else previous.get(
            "alerting", previous.get("status") == "empty"
        )
        if previous and previous_alerting != alerting:
            event = {"map": map_name, "kind": "below" if alerting else "recovered", "players": players, "threshold": threshold, "at": timestamp}
            st.session_state.events.insert(0, event)
            st.session_state.events = st.session_state.events[:100]
            notifications.append(event)

    for event in notifications:
        if event["kind"] == "below":
            message = f"🚨 **{event['map']} is below its player threshold** — {event['players']} player(s), threshold is {event['threshold']}."
        else:
            message = f"✅ **{event['map']} recovered** — {event['players']} player(s), threshold is {event['threshold']}."
        if st.session_state.discord_alerts_enabled:
            send_discord(st.session_state.discord_webhook_url, message)

    st.session_state.last_check_had_empty = any(
        st.session_state.statuses[name]["alerting"]
        for name in st.session_state.watched_maps
    )
    st.session_state.last_checked_at = timestamp
    next_interval = (
        st.session_state.empty_delay_seconds
        if st.session_state.empty_delay_enabled and st.session_state.last_check_had_empty
        else st.session_state.normal_interval_seconds
    )
    st.session_state.next_check_at = (
        next_check_text(next_interval) if st.session_state.monitoring else ""
    )
    st.session_state.last_error = ""


def initialize():
    saved_maps, saved_thresholds = load_saved_preferences()
    defaults = {
        "watched_maps": saved_maps if saved_maps is not None else ["gef_dun02"],
        "statuses": {},
        "events": [],
        "thresholds": {"gef_dun02": 1, **saved_thresholds},
        "monitoring": False,
        "last_checked_at": "",
        "next_check_at": "",
        "last_error": "",
        "map_url": read_secret("MAP_URL", DEFAULT_MAP_URL),
        "poll_interval": max(30, int(read_secret("POLL_INTERVAL_SECONDS", "60"))),
        "normal_value": max(1, int(read_secret("POLL_INTERVAL_SECONDS", "60"))),
        "normal_unit": "seconds",
        "empty_delay_value": max(1, int(read_secret("EMPTY_DELAY_SECONDS", "300")) // 60),
        "empty_delay_unit": "minutes",
        "empty_delay_enabled": True,
        "last_check_had_empty": False,
        "dark_mode": False,
        "discord_webhook_url": read_secret("DISCORD_WEBHOOK_URL", ""),
        "discord_alerts_enabled": True,
        "map_options": ["gef_dun02"],
    }
    for key, value in defaults.items():
        st.session_state.setdefault(key, value)


st.set_page_config(page_title="uaRO Map Watcher", page_icon="🎮", layout="centered")
browser_storage = LocalStorage()
initialize()

access_token = read_secret("ACCESS_TOKEN", "")
provided_token = st.query_params.get("token", "")
if access_token and provided_token != access_token:
    st.title("uaRO Map Watcher")
    st.error("Access token required. Add ?token=YOUR_ACCESS_TOKEN to the app URL.")
    st.stop()

with st.sidebar:
    st.header("Settings")
    st.session_state.dark_mode = st.toggle("Dark mode", value=st.session_state.dark_mode)
    st.session_state.discord_alerts_enabled = st.toggle(
        "Discord alerts",
        value=st.session_state.discord_alerts_enabled,
        help="Turn this off to continue checking maps without sending Discord messages.",
    )
    st.markdown(f"[Open original uaRO map page]({st.session_state.map_url})")
    st.divider()
    st.subheader("Monitoring intervals")
    st.number_input(
        "1. How often to check maps",
        min_value=1,
        max_value=86400,
        step=1,
        key="normal_value",
        help="The first check happens immediately after Start Monitoring. This controls normal repeat checks.",
    )
    st.selectbox(
        "Normal interval unit",
        list(TIME_UNITS),
        index=list(TIME_UNITS).index(st.session_state.normal_unit),
        key="normal_unit",
    )
    st.number_input(
        "2. Delay after first empty result",
        min_value=1,
        max_value=86400,
        step=1,
        key="empty_delay_value",
        help="After a watched map is found empty, this is the delay before the next full uaRO page ping.",
    )
    st.selectbox(
        "Empty-result delay unit",
        list(TIME_UNITS),
        index=list(TIME_UNITS).index(st.session_state.empty_delay_unit),
        key="empty_delay_unit",
    )
    st.session_state.empty_delay_enabled = st.toggle(
        "Use empty-result delay",
        value=st.session_state.empty_delay_enabled,
        help="When disabled, repeat checks use the normal interval even after a map is empty.",
    )
    st.session_state.normal_interval_seconds = max(
        30, int(st.session_state.normal_value) * TIME_UNITS[st.session_state.normal_unit]
    )
    st.session_state.empty_delay_seconds = max(
        30, int(st.session_state.empty_delay_value) * TIME_UNITS[st.session_state.empty_delay_unit]
    )
    st.caption(
        f"Normal: {st.session_state.normal_interval_seconds}s · Empty delay: {st.session_state.empty_delay_seconds}s"
    )

if st.session_state.dark_mode:
    st.markdown(
        """<style>
        .stApp, [data-testid="stAppViewContainer"] { background: #243247; color: #f8fafc; }
        [data-testid="stHeader"] { background: rgba(36, 50, 71, 0.96); }
        [data-testid="stSidebar"] { background: #2d3b52; }
        [data-testid="stMarkdownContainer"] p, [data-testid="stMarkdownContainer"] li,
        [data-testid="stMarkdownContainer"] h1, [data-testid="stMarkdownContainer"] h2,
        [data-testid="stMarkdownContainer"] h3, [data-testid="stWidgetLabel"] p,
        [data-testid="stWidgetLabel"] label { color: #f8fafc !important; }
        [data-testid="stCaptionContainer"] p, [data-testid="stCaptionContainer"] span,
        [data-testid="stHelp"] { color: #cbd5e1 !important; }
        input, textarea, [data-baseweb="select"] *, [data-baseweb="input"] * {
            color: #f8fafc !important; background-color: #1e293b !important;
        }
        [data-testid="stMetricValue"] { color: #f8fafc !important; font-size: 1rem; }
        [data-testid="stMetricLabel"] { color: #cbd5e1 !important; }
        [data-testid="stButton"] button { background: #40516b !important; color: #f8fafc !important; border: 1px solid #7183a0 !important; }
        [data-testid="stButton"] button * { color: #f8fafc !important; }
        [data-testid="stButton"] button:hover { background: #526987 !important; color: #ffffff !important; border-color: #a9bad3 !important; }
        [data-testid="stButton"] button[kind="primary"] { background: #176b61 !important; border-color: #55c5b6 !important; }
        [data-testid="stButton"] button[kind="primary"]:hover { background: #238c7e !important; }
        .status-chip { display:inline-block; padding:2px 8px; border-radius:999px; font-size:.75rem; font-weight:700; }
        .status-ok { background:#14532d; color:#bbf7d0 !important; }
        .status-alert { background:#7f1d1d; color:#fecaca !important; }
        .status-waiting { background:#334155; color:#e2e8f0 !important; }
        .status-header { color:#cbd5e1 !important; font-size:.75rem; font-weight:700; text-transform:uppercase; }
        .status-times { color:#cbd5e1; font-size:.68rem; line-height:1.35; text-align:right; padding-top:.35rem; white-space:nowrap; }
        .status-map { font-weight:700; font-size:.9rem; line-height:2.1rem; }
        .status-players { font-size:.9rem; line-height:2.1rem; }
        </style>""",
        unsafe_allow_html=True,
    )

st.title("🎮 uaRO Map Watcher")
st.caption("Watch Ragnarok maps and receive Discord alerts when players leave or return.")

left, middle, right = st.columns([1, 1, 1])
with left:
    if st.button("▶ Start Monitoring", type="primary", use_container_width=True):
        st.session_state.monitoring = True
        st.rerun()
with middle:
    if st.button("■ Stop Monitoring", use_container_width=True):
        st.session_state.monitoring = False
        st.rerun()
with right:
    manual_check = st.button("↻ Check Page Now", use_container_width=True)

if st.session_state.monitoring:
    refresh_seconds = (
        st.session_state.empty_delay_seconds
        if st.session_state.empty_delay_enabled and st.session_state.last_check_had_empty
        else st.session_state.normal_interval_seconds
    )
    st_autorefresh(interval=refresh_seconds * 1000, key="map_poll")

if st.session_state.monitoring or manual_check:
    try:
        check_maps()
    except Exception as error:
        st.session_state.last_error = str(error)

if st.session_state.monitoring:
    active_interval = (
        st.session_state.empty_delay_seconds
        if st.session_state.empty_delay_enabled and st.session_state.last_check_had_empty
        else st.session_state.normal_interval_seconds
    )
    st.success(f"Monitoring ON — next full page ping in about {active_interval} seconds.")
else:
    st.info("Monitoring OFF — no uaRO checks are running.")

refresh_col, map_col, add_col = st.columns([1.1, 3.2, 0.9])
with refresh_col:
    if st.button("↻ Refresh map list", use_container_width=True):
        try:
            live_maps = fetch_maps(st.session_state.map_url)
            st.session_state.map_options = sorted(set(st.session_state.map_options) | set(live_maps))
            st.session_state.map_list_message = f"Loaded {len(live_maps)} map names from uaRO."
        except Exception as error:
            st.session_state.map_list_message = f"Could not load map names: {error}"
with map_col:
    map_options = sorted(set(st.session_state.map_options) | set(st.session_state.watched_maps))
    selected_map = st.selectbox(
        "Add map",
        map_options,
        index=None,
        placeholder="Select a map or type a map name",
        accept_new_options=True,
        key="map_picker",
        help="Choose a map from the list or type an unlisted map name.",
        disabled=not map_options,
    )
with add_col:
    st.write("")
    st.write("")
    if st.button("Add", use_container_width=True, disabled=not selected_map):
        selected_map = selected_map.strip()
        if not re.fullmatch(r"[A-Za-z0-9_-]+", selected_map):
            st.error("Use letters, numbers, underscores, or hyphens only.")
        elif selected_map not in st.session_state.watched_maps:
            st.session_state.watched_maps.append(selected_map)
            st.session_state.map_options = sorted(set(st.session_state.map_options) | {selected_map})
            st.session_state.thresholds.setdefault(selected_map, 1)
            save_preferences()
            st.rerun()
        elif selected_map in st.session_state.watched_maps:
            st.info(f"Already watching {selected_map}.")

st.caption("Choose a map from the list or type an unlisted name. Watched maps remain available after they disappear from uaRO.")
if st.session_state.get("map_list_message"):
    st.caption(st.session_state.map_list_message)

status_title, status_time = st.columns([1.6, 2.4])
with status_title:
    st.markdown("#### Current status")
with status_time:
    last_check = st.session_state.last_checked_at or "not yet"
    next_check = st.session_state.next_check_at if st.session_state.monitoring else "not scheduled"
    st.markdown(
        f'<div class="status-times">Last: {last_check}<br>Next: {next_check}</div>',
        unsafe_allow_html=True,
    )
if not st.session_state.watched_maps:
    st.caption("No maps are being watched.")
else:
    for map_name in st.session_state.watched_maps:
        status = st.session_state.statuses.get(map_name, {})
        threshold = int(st.session_state.thresholds.get(map_name, 1))
        players = status.get("players", "—")
        col1, col2, col3, col4, col5 = st.columns([2.1, 0.75, 1.0, 0.7, 0.25])
        with col1:
            st.markdown(f'<span class="status-map">{map_name}</span>', unsafe_allow_html=True)
        with col2:
            st.markdown(f'<span class="status-players">{players}</span>', unsafe_allow_html=True)
        with col3:
            new_threshold = st.number_input(
                "Threshold",
                min_value=1,
                max_value=9999,
                value=threshold,
                step=1,
                key=f"threshold_{map_name}",
                label_visibility="collapsed",
            )
            st.session_state.thresholds[map_name] = int(new_threshold)
            if int(new_threshold) != threshold:
                save_preferences()
        with col4:
            if not status:
                label, css = "WAITING", "status-waiting"
            elif status.get("alerting"):
                label, css = "ALERT", "status-alert"
            else:
                label, css = "OK", "status-ok"
            st.markdown(f'<span class="status-chip {css}">{label}</span>', unsafe_allow_html=True)
        with col5:
            if st.button("×", key=f"remove_{map_name}", help=f"Stop watching {map_name}"):
                st.session_state.watched_maps.remove(map_name)
                st.session_state.statuses.pop(map_name, None)
                st.session_state.thresholds.pop(map_name, None)
                save_preferences()
                st.rerun()

if st.session_state.last_error:
    st.error(f"Last error: {st.session_state.last_error}")

st.subheader("Recent changes")
if st.session_state.events:
    for event in st.session_state.events[:10]:
        kind = event_kind(event)
        description = "fell below threshold" if kind == "below" else "recovered"
        players = event.get("players", 0)
        threshold = event.get("threshold", 1)
        st.write(
            f"{event['map']} {description} — {players} player(s), "
            f"threshold {threshold} — {event.get('at', 'unknown time')}"
        )
else:
    st.caption("No changes yet.")
