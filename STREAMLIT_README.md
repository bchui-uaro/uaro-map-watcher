# uaRO Map Watcher — Streamlit Edition

This version runs on Streamlit Community Cloud and includes a dashboard with manual monitoring controls.

## Deploy

1. Upload `streamlit_app.py` and `requirements-streamlit.txt` to your GitHub repository.
2. Open Streamlit Community Cloud and choose **Create app**.
3. Select the repository and branch.
4. Set the main file path to `streamlit_app.py`.
5. Deploy the app.
6. In the app settings, add these secrets:

```toml
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/REPLACE_ME"
ACCESS_TOKEN = "choose-a-secret"
POLL_INTERVAL_SECONDS = "60"
MAP_URL = "https://uaro.net/cp/?module=character&action=mapstats"
```

`DISCORD_WEBHOOK_URL` is required for Discord alerts. `ACCESS_TOKEN` is optional but recommended for a public app. If set, open the app with `?token=choose-a-secret`.

## Use

The app starts with monitoring OFF. Use the sidebar to enter two intervals: the normal map-check interval and the delay after a map is first found empty. Click **Refresh map list**, select a map from the dropdown, and click **Add map**. Click **Start Monitoring** to perform an initial check immediately. Click **Stop Monitoring** when finished.

The uaRO page only displays maps that currently have players. Therefore, an empty map cannot be discovered from a fresh page load; maps disappear when empty. The app keeps watched maps in the dropdown after they disappear and includes `gef_dun02` by default.

The free Streamlit service keeps state in the current app session. If the app sleeps or restarts, monitoring returns to OFF and watched maps reset to the default `gef_dun02`.
