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

The app starts with monitoring OFF. Use the sidebar to enter two intervals: the normal map-check interval and the delay after a map is first found empty. You can turn off **Use empty-result delay** to use the normal interval for every check. Click **Check Page Now** for a single manual page check without starting continuous monitoring. Click **Refresh map list**, select a map from the dropdown, and click **Add map**. Click **Start Monitoring** to begin automatic checks. Click **Stop Monitoring** when finished.

Each watched map has an **Alert below** threshold. A value of `2` alerts when the map has `0` or `1` player and sends a recovery message when it reaches `2` or more. The default value is `1`, which preserves empty-map-only alerts.

Watched maps and thresholds are saved in the browser's local storage, so refreshing the browser page preserves them without changing the URL. Settings are browser-specific; opening the app in a different browser will start with its default map.

The uaRO page only displays maps that currently have players. Therefore, an empty map cannot be discovered from a fresh page load; maps disappear when empty. Use the manual map-name field to add an unlisted map. The app keeps watched maps in the dropdown after they disappear and includes `gef_dun02` by default.

The free Streamlit service keeps state in the current app session. If the app sleeps or restarts, monitoring returns to OFF and watched maps reset to the default `gef_dun02`.
