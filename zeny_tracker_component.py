import json
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "zeny_tracker" / "frontend" / "dist"
BACKUP_PATH = ROOT / "zeny_tracker" / "zeny-farm-backup.json"


@st.cache_resource
def load_component():
    js_path = FRONTEND / "renderer.js"
    css_path = FRONTEND / "style.css"
    if not js_path.exists() or not css_path.exists():
        return None
    return st.components.v2.component(
        "zeny_farm_tracker",
        html='<div class="zeny-tracker-root"></div>',
        css=css_path.read_text(encoding="utf-8"),
        js=js_path.read_text(encoding="utf-8"),
    )


def render_zeny_tracker():
    backup = json.loads(BACKUP_PATH.read_text(encoding="utf-8"))
    component = load_component()
    if component is None:
        st.title("🪙 Zeny Tracker")
        st.error("The tracker interface has not been built yet.")
        st.code("cd zeny_tracker/frontend && pnpm install && pnpm build", language="bash")
        return
    component(data={"initialBackup": backup}, key="zeny_farm_tracker")
