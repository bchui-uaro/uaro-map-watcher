import html
import json
import re
from datetime import datetime
from html.parser import HTMLParser
from urllib.parse import unquote
from zoneinfo import ZoneInfo

import requests
import streamlit as st
from streamlit_local_storage import LocalStorage

DEFAULT_MAP_URL = "https://uaro.net/cp/?module=character&action=mapstats"
PREFERENCES_KEY = "uaro_map_watcher_preferences"
PACIFIC = ZoneInfo("America/Los_Angeles")
browser_storage = None


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
    return {
        match.group(1): int(match.group(2))
        for match in re.finditer(r"\b([A-Za-z0-9_-]+)\s+(\d+)\s+player", text, re.IGNORECASE)
    }


def fetch_maps(map_url):
    response = requests.get(
        map_url,
        headers={"User-Agent": "uaRO-map-watcher/1.0"},
        timeout=15,
    )
    response.raise_for_status()
    return parse_maps(response.text)


def now_text():
    return datetime.now(PACIFIC).strftime("%Y-%m-%d %I:%M:%S %p %Z")


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
        stored = browser_storage.getItem(PREFERENCES_KEY)
    except Exception:
        stored = None
    if stored not in (None, ""):
        watched_maps, thresholds = decode_preferences(stored)
        if watched_maps is not None:
            return watched_maps, thresholds

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
        pass


def initialize():
    saved_maps, saved_thresholds = load_saved_preferences()
    defaults = {
        "watched_maps": saved_maps if saved_maps is not None else ["gef_dun02"],
        "statuses": {},
        "events": [],
        "thresholds": {"gef_dun02": 1, **saved_thresholds},
        "last_checked_at": "",
        "last_error": "",
        "map_url": read_secret("MAP_URL", DEFAULT_MAP_URL),
        "dark_mode": False,
        "map_options": ["gef_dun02"],
    }
    for key, value in defaults.items():
        st.session_state.setdefault(key, value)


def check_maps():
    maps = fetch_maps(st.session_state.map_url)
    st.session_state.map_options = sorted(set(st.session_state.map_options) | set(maps))
    timestamp = now_text()
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
            event = {
                "map": map_name,
                "kind": "below" if alerting else "recovered",
                "players": players,
                "threshold": threshold,
                "at": timestamp,
            }
            st.session_state.events.insert(0, event)
    st.session_state.events = st.session_state.events[:100]
    st.session_state.last_checked_at = timestamp
    st.session_state.last_error = ""


def render_sidebar():
    global browser_storage
    with st.sidebar:
        browser_storage = LocalStorage()
        initialize()
        st.header("🗺️ Map Alerts")
        st.caption("Manual uaRO map population checks")
        if st.button("↻ Check Page Now", type="primary", use_container_width=True):
            try:
                check_maps()
            except Exception as error:
                st.session_state.last_error = str(error)

        if st.session_state.last_checked_at:
            st.caption(f"Last checked: {st.session_state.last_checked_at}")
        if st.session_state.last_error:
            st.error(f"Check failed: {st.session_state.last_error}")

        st.divider()
        st.subheader("Watched maps")
        if st.button("↻ Refresh map list", use_container_width=True):
            try:
                live_maps = fetch_maps(st.session_state.map_url)
                st.session_state.map_options = sorted(set(st.session_state.map_options) | set(live_maps))
                st.session_state.map_list_message = f"Loaded {len(live_maps)} map names from uaRO."
            except Exception as error:
                st.session_state.map_list_message = f"Could not load maps: {error}"

        map_options = sorted(set(st.session_state.map_options) | set(st.session_state.watched_maps))
        selected_map = st.selectbox(
            "Add map",
            map_options,
            index=None,
            placeholder="Choose or type a map name",
            accept_new_options=True,
            key="map_picker",
            disabled=not map_options,
        )
        if st.button("Add watched map", use_container_width=True, disabled=not selected_map):
            name = selected_map.strip()
            if not re.fullmatch(r"[A-Za-z0-9_-]+", name):
                st.error("Use letters, numbers, underscores, or hyphens only.")
            elif name not in st.session_state.watched_maps:
                st.session_state.watched_maps.append(name)
                st.session_state.map_options = sorted(set(st.session_state.map_options) | {name})
                st.session_state.thresholds.setdefault(name, 1)
                save_preferences()
                st.rerun()
            else:
                st.info(f"Already watching {name}.")
        if st.session_state.get("map_list_message"):
            st.caption(st.session_state.map_list_message)

        if not st.session_state.watched_maps:
            st.caption("No maps are being watched.")
        for map_name in st.session_state.watched_maps:
            status = st.session_state.statuses.get(map_name, {})
            players = status.get("players", "—")
            state = "ALERT" if status.get("alerting") else ("OK" if status else "WAITING")
            with st.expander(f"{map_name} · {players} · {state}"):
                threshold = int(st.session_state.thresholds.get(map_name, 1))
                new_threshold = st.number_input(
                    "Alert below this player count",
                    min_value=1,
                    max_value=9999,
                    value=threshold,
                    step=1,
                    key=f"threshold_{map_name}",
                )
                st.session_state.thresholds[map_name] = int(new_threshold)
                if int(new_threshold) != threshold:
                    save_preferences()
                if status:
                    st.caption(f"Checked {status.get('checked_at', 'unknown time')}")
                if st.button("Remove map", key=f"remove_{map_name}", use_container_width=True):
                    st.session_state.watched_maps.remove(map_name)
                    st.session_state.statuses.pop(map_name, None)
                    st.session_state.thresholds.pop(map_name, None)
                    save_preferences()
                    st.rerun()

        with st.expander("Recent changes"):
            if st.session_state.events:
                for event in st.session_state.events[:10]:
                    description = "fell below threshold" if event["kind"] == "below" else "recovered"
                    st.caption(
                        f"{event['map']} {description} — {event['players']} player(s), "
                        f"threshold {event['threshold']} — {event['at']}"
                    )
            else:
                st.caption("No changes yet.")

        st.divider()
        st.session_state.dark_mode = st.toggle("Dark mode", value=st.session_state.dark_mode)
        st.markdown(f"[Open uaRO map page]({st.session_state.map_url})")

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
            input, textarea, [data-baseweb="select"] *, [data-baseweb="input"] * {
                color: #f8fafc !important; background-color: #1e293b !important;
            }
            [data-testid="stButton"] button { background: #40516b !important; color: #f8fafc !important; }
            [data-testid="stButton"] button[kind="primary"] { background: #176b61 !important; }
            </style>""",
            unsafe_allow_html=True,
        )
