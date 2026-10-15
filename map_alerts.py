import html
import json
import re
from datetime import datetime
from html.parser import HTMLParser
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
    response = requests.get(map_url, headers={"User-Agent": "uaRO-map-watcher/1.0"}, timeout=15)
    response.raise_for_status()
    return parse_maps(response.text)


def now_text():
    return datetime.now(PACIFIC).strftime("%Y-%m-%d %I:%M:%S %p %Z")


def load_saved_maps():
    try:
        stored = browser_storage.getItem(PREFERENCES_KEY)
        if stored not in (None, ""):
            data = json.loads(stored)
            st.session_state.watched_maps_saved_at = data.get("saved_at")
            names = data.get("watched_maps", [])
            return [name for name in names if isinstance(name, str) and re.fullmatch(r"[A-Za-z0-9_-]+", name)]
    except Exception:
        pass
    names = st.query_params.get("maps", "gef_dun02").split(",")
    return [name for name in names if re.fullmatch(r"[A-Za-z0-9_-]+", name)]


def save_preferences():
    try:
        saved_at = datetime.now(PACIFIC).isoformat(timespec="seconds")
        browser_storage.setItem(PREFERENCES_KEY, json.dumps({
            "watched_maps": st.session_state.watched_maps,
            "saved_at": saved_at,
        }))
        st.session_state.watched_maps_saved_at = saved_at
        return True
    except Exception:
        return False


def initialize():
    st.session_state.setdefault("watched_maps", load_saved_maps())
    st.session_state.setdefault("player_counts", {})
    st.session_state.setdefault("last_checked_at", "")
    st.session_state.setdefault("last_error", "")
    st.session_state.setdefault("map_url", read_secret("MAP_URL", DEFAULT_MAP_URL))
    st.session_state.setdefault("map_options", ["gef_dun02"])


def check_maps():
    maps = fetch_maps(st.session_state.map_url)
    st.session_state.map_options = sorted(set(st.session_state.map_options) | set(maps))
    st.session_state.player_counts = {name: maps.get(name, 0) for name in st.session_state.watched_maps}
    st.session_state.last_checked_at = now_text()
    st.session_state.last_error = ""


def render_sidebar():
    global browser_storage
    with st.sidebar:
        browser_storage = LocalStorage()
        initialize()
        st.header("🗺️ Map Alerts")
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
        st.subheader("Watched Maps")
        if st.button("↻ Refresh map list", use_container_width=True):
            try:
                live_maps = fetch_maps(st.session_state.map_url)
                st.session_state.map_options = sorted(set(st.session_state.map_options) | set(live_maps))
                st.session_state.map_list_message = f"Loaded {len(live_maps)} map names from uaRO."
            except Exception as error:
                st.session_state.map_list_message = f"Could not load maps: {error}"

        options = sorted(set(st.session_state.map_options) | set(st.session_state.watched_maps))
        selected = st.selectbox("Add map", options, index=None, placeholder="Choose or type a map name",
                                accept_new_options=True, key="map_picker", disabled=not options)
        if st.button("Add watched map", use_container_width=True, disabled=not selected):
            name = selected.strip()
            if not re.fullmatch(r"[A-Za-z0-9_-]+", name):
                st.error("Use letters, numbers, underscores, or hyphens only.")
            elif name not in st.session_state.watched_maps:
                st.session_state.watched_maps.append(name)
                st.session_state.map_options = sorted(set(st.session_state.map_options) | {name})
                st.session_state.watch_save_error = not save_preferences()
                st.rerun()
            else:
                st.info(f"Already watching {name}.")
        if st.session_state.get("map_list_message"):
            st.caption(st.session_state.map_list_message)

        rows = [{"Map name": name, "Player count": st.session_state.player_counts.get(name, "—")}
                for name in st.session_state.watched_maps]
        st.table(rows)
        saved_at = st.session_state.get("watched_maps_saved_at")
        if saved_at:
            st.caption(f"Watched map list saved in this browser · {saved_at.replace('T', ' ')}")
        elif st.session_state.watched_maps:
            st.caption("Watched map list is saved in this browser.")
        if st.session_state.get("watch_save_error"):
            st.warning("Could not save watched maps to browser storage. Keep a downloaded backup.")
        if st.session_state.watched_maps:
            backup = {
                "watched_maps": st.session_state.watched_maps,
                "exported_at": datetime.now(PACIFIC).isoformat(timespec="seconds"),
            }
            st.download_button(
                "Download watched maps backup",
                data=json.dumps(backup, indent=2),
                file_name="uaro-watched-maps.json",
                mime="application/json",
                use_container_width=True,
            )
        if st.session_state.watched_maps:
            with st.expander("Remove a watched map"):
                remove_name = st.selectbox("Map", st.session_state.watched_maps, key="remove_map_picker")
                if st.button("Remove map", key="remove_watched_map", use_container_width=True):
                    st.session_state.watched_maps.remove(remove_name)
                    st.session_state.player_counts.pop(remove_name, None)
                    st.session_state.watch_save_error = not save_preferences()
                    st.rerun()

        st.divider()
        st.markdown(f"[Open uaRO map page]({st.session_state.map_url})")
