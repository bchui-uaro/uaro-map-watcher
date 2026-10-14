import streamlit as st

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

map_alerts = st.Page("pages/map_alerts.py", title="Map Alerts", icon="🗺️", default=True)
zeny_tracker = st.Page("pages/zeny_tracker.py", title="Zeny Tracker", icon="🪙")
page = st.navigation([map_alerts, zeny_tracker], position="sidebar")
page.run()
