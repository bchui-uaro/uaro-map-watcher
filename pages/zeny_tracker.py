import json
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "zeny_tracker" / "frontend" / "dist"


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


backup_path = ROOT / "zeny_tracker" / "zeny-farm-backup.json"
backup = json.loads(backup_path.read_text(encoding="utf-8"))

st.title("🪙 Zeny Tracker")
st.caption("Track farming sessions, compare maps, and review your zeny per hour.")

component = load_component()
if component is None:
    st.error("The tracker interface has not been built yet.")
    st.code("cd zeny_tracker/frontend && pnpm install && pnpm build", language="bash")
else:
    component(data={"initialBackup": backup}, key="zeny_farm_tracker")
