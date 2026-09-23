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

The app starts with monitoring OFF. Add maps such as `gef_dun02`, then click **Start Monitoring**. The app checks the uaRO page at the configured interval and sends alerts only when a map changes between occupied and empty. Click **Stop Monitoring** when finished.

The free Streamlit service keeps state in the current app session. If the app sleeps or restarts, monitoring returns to OFF and watched maps reset to the default `gef_dun02`.
