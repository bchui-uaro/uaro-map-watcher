import html
import re
from datetime import datetime, timezone
from html.parser import HTMLParser

import requests
import streamlit as st
from streamlit_autorefresh import st_autorefresh


DEFAULT_MAP_URL = "https://uaro.net/cp/?module=character&action=mapstats"
TIME_UNITS = {"seconds": 1, "minutes": 60, "hours": 3600}


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
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


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
        send_discord(st.session_state.discord_webhook_url, message)

    st.session_state.last_check_had_empty = any(
        st.session_state.statuses[name]["alerting"]
        for name in st.session_state.watched_maps
    )
    st.session_state.last_checked_at = timestamp
    st.session_state.last_error = ""


def initialize():
    defaults = {
        "watched_maps": ["gef_dun02"],
        "statuses": {},
        "events": [],
        "thresholds": {"gef_dun02": 1},
        "monitoring": False,
        "last_checked_at": "",
        "last_error": "",
        "map_url": read_secret("MAP_URL", DEFAULT_MAP_URL),
        "poll_interval": max(30, int(read_secret("POLL_INTERVAL_SECONDS", "60"))),
        "normal_value": max(1, int(read_secret("POLL_INTERVAL_SECONDS", "60"))),
        "normal_unit": "seconds",
        "empty_delay_value": max(1, int(read_secret("EMPTY_DELAY_SECONDS", "300")) // 60),
        "empty_delay_unit": "minutes",
        "last_check_had_empty": False,
        "dark_mode": True,
        "discord_webhook_url": read_secret("DISCORD_WEBHOOK_URL", ""),
        "map_options": ["gef_dun02"],
    }
    for key, value in defaults.items():
        st.session_state.setdefault(key, value)


st.set_page_config(page_title="uaRO Map Watcher", page_icon="🎮", layout="centered")
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
        .stApp { background: #0f172a; }
        [data-testid="stHeader"] { background: rgba(15, 23, 42, 0.85); }
        [data-testid="stSidebar"] { background: #111827; }
        [data-testid="stMetricValue"] { color: #e2e8f0; }
        </style>""",
        unsafe_allow_html=True,
    )

st.title("🎮 uaRO Map Watcher")
st.caption("Watch Ragnarok maps and receive Discord alerts when players leave or return.")

if st.session_state.monitoring:
    refresh_seconds = (
        st.session_state.empty_delay_seconds
        if st.session_state.last_check_had_empty
        else st.session_state.normal_interval_seconds
    )
    st_autorefresh(interval=refresh_seconds * 1000, key="map_poll")
    try:
        check_maps()
    except Exception as error:
        st.session_state.last_error = str(error)

left, right = st.columns(2)
with left:
    if st.button("▶ Start Monitoring", type="primary", use_container_width=True):
        st.session_state.monitoring = True
        st.rerun()
with right:
    if st.button("■ Stop Monitoring", use_container_width=True):
        st.session_state.monitoring = False
        st.rerun()

if st.session_state.monitoring:
    active_interval = (
        st.session_state.empty_delay_seconds
        if st.session_state.last_check_had_empty
        else st.session_state.normal_interval_seconds
    )
    st.success(f"Monitoring ON — next full page ping in about {active_interval} seconds.")
else:
    st.info("Monitoring OFF — no uaRO checks are running.")

refresh_col, map_col, add_col = st.columns([1.2, 2.5, 1.2])
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
    map_name = st.selectbox("Map name", map_options, disabled=not map_options)
with add_col:
    st.write("")
    st.write("")
    if st.button("Add map", use_container_width=True, disabled=not map_options):
        if map_name not in st.session_state.watched_maps:
            st.session_state.watched_maps.append(map_name)
            st.session_state.thresholds.setdefault(map_name, 1)
            st.rerun()

st.caption("The list contains maps currently reported by uaRO plus maps already being watched. Empty maps are not listed by uaRO, so keep a watched map selected even when it disappears from the source page.")
if st.session_state.get("map_list_message"):
    st.caption(st.session_state.map_list_message)

st.subheader("Current status")
if not st.session_state.watched_maps:
    st.caption("No maps are being watched.")
else:
    for map_name in st.session_state.watched_maps:
        status = st.session_state.statuses.get(map_name, {})
        threshold = int(st.session_state.thresholds.get(map_name, 1))
        players = status.get("players", "—")
        col1, col2, col3 = st.columns([2.2, 1.5, 1])
        with col1:
            st.write(f"**{map_name}**")
            st.caption(f"{players} player(s) · alert below {threshold}")
        with col2:
            new_threshold = st.number_input(
                "Alert below",
                min_value=1,
                max_value=9999,
                value=threshold,
                step=1,
                key=f"threshold_{map_name}",
            )
            st.session_state.thresholds[map_name] = int(new_threshold)
        with col3:
            label = "WAITING" if not status else ("ALERT" if status.get("alerting") else "OK")
            st.metric("Status", label)
            if st.button("Remove", key=f"remove_{map_name}"):
                st.session_state.watched_maps.remove(map_name)
                st.session_state.statuses.pop(map_name, None)
                st.session_state.thresholds.pop(map_name, None)
                st.rerun()

st.caption(f"Last checked: {st.session_state.last_checked_at or 'not yet'}")
if st.session_state.last_error:
    st.error(f"Last error: {st.session_state.last_error}")

st.subheader("Recent changes")
if st.session_state.events:
    for event in st.session_state.events[:10]:
        description = "fell below threshold" if event["kind"] == "below" else "recovered"
        st.write(
            f"{event['map']} {description} — {event['players']} player(s), "
            f"threshold {event['threshold']} — {event['at']}"
        )
else:
    st.caption("No changes yet.")
