# uaRO Tools — Streamlit

A single Streamlit app with two pages: **Map Alerts** for manual uaRO map checks and **Zeny Tracker** for Ragnarok farming sessions.

## Run locally

1. Install the Python requirements from `requirements-streamlit.txt`.
2. Build the React tracker once:

   ```sh
   cd zeny_tracker/frontend
   pnpm install
   pnpm build
   ```

3. From the project root, run `streamlit run streamlit_app.py`.

## Configure secrets

Add these values in `.streamlit/secrets.toml` or the Streamlit deployment settings as needed:

```toml
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/REPLACE_ME"
ACCESS_TOKEN = "choose-a-secret"
MAP_URL = "https://uaro.net/cp/?module=character&action=mapstats"
```

`DISCORD_WEBHOOK_URL` is optional. If set, manual checks can send Discord messages when a watched map crosses its threshold. `ACCESS_TOKEN` is optional; when set, open the app with `?token=choose-a-secret`.

## Map Alerts

Map checks run only when you click **Check Page Now**. Watched maps and thresholds are stored in this browser. The uaRO page only lists maps with players, so you can also type a map name to watch it while empty. The current status and recent changes are held for the active Streamlit session.

## Zeny Tracker

The provided backup is loaded on first use in each browser. The tracker then saves its session, history, maps, monster database, and custom items in that browser's local storage. Use the tracker’s built-in JSON backup export/import to move data to another browser or device. Existing browser tracker data is preserved and takes precedence over the bundled starter backup.
