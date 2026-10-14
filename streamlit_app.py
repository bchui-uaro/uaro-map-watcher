import streamlit as st

from map_alerts import render_sidebar
from zeny_tracker_component import render_zeny_tracker

st.set_page_config(page_title="uaRO Tools", page_icon="🎮", layout="wide")

try:
    access_token = st.secrets.get("ACCESS_TOKEN", "")
except Exception:
    access_token = ""
provided_token = st.query_params.get("token", "")
if access_token and provided_token != access_token:
    st.title("uaRO Tools")
    st.error("Access token required. Add ?token=YOUR_ACCESS_TOKEN to the app URL.")
    st.stop()

render_sidebar()
st.title("🪙 Zeny Tracker")
st.caption("Track farming sessions, compare maps, and review your zeny per hour.")
render_zeny_tracker()
