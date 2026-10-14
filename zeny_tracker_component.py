import json
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "zeny_tracker" / "frontend" / "dist"
BACKUP_PATH = ROOT / "zeny_tracker" / "zeny-farm-backup.json"


@st.cache_resource
def load_component():
    # Keep a non-leading newline so Streamlit doesn't mistake minified assets for paths.
    js = "/* Inline tracker bundle */\n" + (FRONTEND / "renderer.js").read_text(encoding="utf-8")
    css = "/* Inline tracker styles */\n" + (FRONTEND / "style.css").read_text(encoding="utf-8")
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
