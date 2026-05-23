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

Data is stored in your browser (`localStorage`, schema version 2). Optional **cloud sync** stores the same dataset in Cloudflare D1 for shared team access. Use **Export** for manual backups; cloud sync auto-saves when signed in.

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 18 |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| PDF export | html2pdf.js |
| Storage | Browser localStorage + optional Cloudflare D1 sync |
| Hosting | Cloudflare Pages (static UI + Functions API) |

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

## Cloud sync (shared roster)

The app can sync roster data to **Cloudflare D1** so coaches and parents on the same team share one dataset across devices.

### One-time Cloudflare setup

1. **Create a D1 database** — Dashboard → **Workers & Pages** → **D1** → Create → name it `assistanalytics`.
2. **Copy the database ID** into `wrangler.toml` (`database_id` under `[[d1_databases]]`).
3. **Run the schema migration:**
   ```bash
   npm run db:migrate:remote
   ```
4. **Bind D1 to Pages** — Pages project → **Settings** → **Functions** → **D1 bindings** → add binding name `DB` → database `assistanalytics`.
5. **Set `SESSION_SECRET`** — Pages → **Settings** → **Environment variables** → add a long random string (production + preview).

### Local API development

```bash
npm install
npm run db:migrate:local
npm run pages:dev
```

Open the URL Wrangler prints (API routes under `/api/*` run as Pages Functions from the `functions/` folder).

### How cloud sync works

- **Sign up** with email + password; optionally create a team (e.g. `7th Grade Gold`) during signup.
- **Invite others** — owners open **Team** for coach/parent invite links, member list, roles, and removal.
- **Parent access** — share the **parent link** (`?join=CODE&role=viewer`) or choose viewer when joining; viewers get read-only UI.
- **Auto-save** — edits debounce to the cloud (~1.5s). Failed saves queue locally and retry when back online.
- **Conflicts** — if two devices save at once, the header offers **Load cloud version**.
- **Local-only mode** — choose **Continue locally without cloud sync** on the login screen (same as pre-cloud behavior).

Export/import JSON backups still work for manual backups and migration.


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

- **Cloud sync requires D1 setup** — See [Cloud sync](#cloud-sync-shared-roster) above. Without it, use Export/import between devices.
- **Legacy migration** — Old saves (`averyGames` or `assistanalytics-games`) migrate into the default Avery player on first load.
- **Film filters** — Parsed from play-by-play keywords; use consistent tags (Assist, Paint touch, LB TOV) for best results.
- **YouTube** — Requires internet for video embeds and links.

## Next improvement ideas

- Magic-link email login
- R2 nightly auto-backup exports
- Offline sync retry queue

## Repository

https://github.com/chadcourtside/assistanalytics

## License

MIT — see [LICENSE](LICENSE).
