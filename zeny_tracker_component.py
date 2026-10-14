import json
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent
BACKUP_PATH = ROOT / "zeny_tracker" / "zeny-farm-backup.json"


@st.cache_resource
def load_component():
    return st.components.v2.component(
        "uaro_zeny_component.zeny_farm_tracker",
        html='<div class="zeny-tracker-root"></div>',
        css="style.css",
        js="renderer.js",
    )


def render_zeny_tracker():
    backup = json.loads(BACKUP_PATH.read_text(encoding="utf-8"))
    component = load_component()
    component(data={"initialBackup": backup}, key="zeny_farm_tracker")
