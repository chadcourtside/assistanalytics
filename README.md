# Assist Analytics

A local-first **multi-player** basketball development app for tracking individual game stats, development benchmarks, and film-linked play-by-play. Built for parents tracking a few players today and coaches managing full rosters during the school season.

## What it does

- **Players** — Add players, **Edit Player** (name, jersey, team) from the header or Roster, and switch via the dropdown
- **Roster** — Team-grouped player list with season snapshot, key benchmark status, and quick actions
- **Dashboard** — Last game snapshot, season trend charts, totals, box score, per-24/32 rates, PDF export
- **Stat Guide** — In-app glossary (header button) plus hover tooltips on stat labels
- **Game Logs** — Add, edit, and delete games; play-by-play and YouTube timestamp links
- **Benchmarks** — Per-player development targets vs season averages; **edit targets in the UI**
- **Smart Film Room** — Structured play-event filters with embedded YouTube playback
- **Export / Import** — JSON backup for moving data between devices (phone ↔ laptop)

Data is stored in your browser (`localStorage`, schema version 2). No account required. Use **Export** before switching devices, then **Import → Replace** on the new device.

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 18 |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| PDF export | html2pdf.js |
| Storage | Browser localStorage |
| Hosting | Cloudflare Pages (static) |

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Build & test

```bash
npm run build
npm run preview
npm test
```

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. In [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → Connect Git.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (or latest LTS)
4. Deploy. SPA routing is handled by `public/_redirects`.

Alternatively, with Wrangler CLI:

```bash
npm run build
npx wrangler pages deploy dist --project-name=assistanalytics
```

## How to use

1. Start the app — a default player (Avery) with sample games loads on first visit.
2. Open **Roster** to see all players by team — use **Edit** to set team names (e.g. `7th Grade Gold`).
3. Use the **Player** dropdown (grouped by team) or click a name on the Roster to switch players.
4. Open **Game Logs**, click **+ Add Game**, and enter box score stats and play-by-play.
5. Paste a YouTube URL on the game card (or in the game form).
6. Use **Smart Film Room** to browse clips by structured event type.
7. Review **Dashboard** for last game, trends, and cumulative stats.
8. Use **Benchmarks** to compare averages against goals — click **Edit Targets** to customize.
9. Open **Stat Guide** for metric definitions.

### Moving between devices (recommended workflow)

1. On the device with your latest data, click **Export** in the header → saves a `.json` backup.
2. On the new device, open the app and click **Import** → choose the file → **Replace**.
3. For combining partial exports (e.g. two coaches), use **Merge** instead of Replace.

## Known limitations

- **No cloud sync** — Data stays in the browser until you export/import. Export regularly during the season.
- **Legacy migration** — Old saves (`averyGames` or `assistanalytics-games`) migrate into the default Avery player on first load.
- **Film filters** — Parsed from play-by-play keywords; use consistent tags (Assist, Paint touch, LB TOV) for best results.
- **YouTube** — Requires internet for video embeds and links.

## Next improvement ideas

- Optional cloud sync (Cloudflare KV / D1)
- Roster / team views for coaches
- Smarter benchmark target parsing for edge-case strings

## Repository

https://github.com/chadcourtside/assistanalytics

## License

MIT — see [LICENSE](LICENSE).
