# uaRO Tools — Streamlit

A single-page app with the **Map Alerts** tracker in the sidebar and the **Zeny Tracker** in the main area. Map checks are manual; there is no background monitoring or Discord integration.

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
ACCESS_TOKEN = "choose-a-secret"
MAP_URL = "https://uaro.net/cp/?module=character&action=mapstats"
```

`ACCESS_TOKEN` is optional. If set, open the app with `?token=choose-a-secret`. Both tools stay on that page, so their controls don't require page navigation.

## Map Alerts

Use **Check Page Now** in the sidebar to fetch current map populations. Watched maps are stored in this browser. The table shows each map name and its latest checked player count. The uaRO page only lists maps with players, so you can also type a map name to watch it while empty.

## Zeny Tracker

The supplied backup is loaded on first use in each browser. The tracker then saves its session, history, maps, monster database, and custom items in that browser's local storage. Use the tracker's JSON backup export/import to move data to another browser or device. Existing browser tracker data is preserved and takes precedence over the bundled starter backup.
