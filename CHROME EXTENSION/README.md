# FocusTrack — Chrome extension + productivity analytics

FocusTrack is a Chrome extension that measures time on websites, labels visits as **productive**, **neutral**, or **unproductive**, syncs totals to a small Node.js backend, and shows a **weekly dashboard** with charts and a short productivity summary.

## Repository layout

- `extension/` — Manifest V3 extension (service worker, popup, options).
- `server/` — Express API with SQLite storage and the static analytics dashboard.

## Quick start

### 1. Backend

```bash
cd server
npm install
npm start
```

The API and dashboard default to **http://localhost:3847**. Open **http://localhost:3847/dashboard/** after the server is running.

### 2. Load the extension

1. Open Chrome → **Extensions** → enable **Developer mode**.
2. **Load unpacked** → select the `extension` folder inside this project.
3. Open the extension **Options** and confirm the backend URL is `http://localhost:3847` (default).
4. Copy your **User id** from the options page; paste it into the dashboard to load your weekly report (or open the dashboard from the popup link, which includes `?userId=`).

### 3. GitHub

Create a new repository on GitHub, then from this project folder:

```bash
git init
git add .
git commit -m "Add FocusTrack extension, API, and dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## API overview

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Liveness check |
| POST | `/api/sync` | Body: `{ userId, rows: [{ hostname, day, category, seconds }] }` — upserts **absolute** per-key totals |
| GET | `/api/weekly?userId=` | Weekly-style JSON for charts + top sites |
| GET | `/api/summary?userId=&days=` | Category totals for a rolling window |
| GET | `/api/daily?userId=&days=` | Per-day category breakdown |

## Notes

- Classification uses `extension/defaultRules.json` plus optional per-host overrides (JSON) on the options page.
- Idle detection (`chrome.idle`) pauses tracking when you are away from the keyboard.
- For coursework submission, follow your instructor’s WhatsApp/video steps for packaging and upload.

## License

MIT — use freely for learning and projects.
