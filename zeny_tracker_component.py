import hashlib
import json
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "zeny_tracker" / "frontend" / "dist"
BACKUP_PATH = ROOT / "zeny_tracker" / "zeny-farm-backup.json"


def load_component():
    # Hash the actual files so Streamlit doesn't reuse a cached renderer after a frontend rebuild.
    js = (FRONTEND / "renderer.js").read_text(encoding="utf-8")
    css = (FRONTEND / "style.css").read_text(encoding="utf-8")
    asset_version = hashlib.sha256((js + "\0" + css).encode("utf-8")).hexdigest()
    return _register_component(asset_version, js, css)


@st.cache_resource
def _register_component(asset_version, _js, _css):
    # Internal newlines keep minified content from being classified as file paths.
    js = "/* Inline tracker bundle */\n" + _js
    css = "/* Inline tracker styles */\n" + _css
    return st.components.v2.component(
        "zeny_farm_tracker",
        html='<div class="zeny-tracker-root"></div>',
        css=css,
        js=js,
    )


def render_zeny_tracker():
    backup = json.loads(BACKUP_PATH.read_text(encoding="utf-8"))
    component = load_component()
    component(data={"initialBackup": backup}, key="zeny_farm_tracker")
