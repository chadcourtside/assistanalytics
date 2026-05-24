# Assist Analytics

A local-first **multi-player** basketball development app for tracking individual game stats, development benchmarks, and film-linked play-by-play. Built for parents tracking a few players today and coaches managing full rosters during the school season.

## What it does

- **Players** — Add players, **Edit Player** (name, jersey, teams) from the header or Roster, and switch via the dropdown
- **Roster** — Team-grouped player list with season snapshot, key benchmark status, and quick actions
- **Dashboard** — Last game snapshot, season trend charts, totals, box score, per-24/32 rates, PDF export
- **Stat Guide** — In-app glossary (header button) plus hover tooltips on stat labels
- **Game Logs** — Add, edit, and delete games; per-game **team** picker (club vs travel); play-by-play and YouTube timestamp links; **Import from narration** (paste transcript or upload audio → Whisper → coach review)
- **Team Night** — Same-date box scores for every player who logged a game
- **Seasons** — Set a **current season** (header badge), archive past seasons, and still view archived stats via season filters
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
   If you already ran the initial migration, apply player links only:
   ```bash
   npm run db:migrate:player-links:remote
   ```
   For magic-link login and password reset:
   ```bash
   npm run db:migrate:auth-tokens:remote
   ```
4. **Bind D1 to Pages** — Pages project → **Settings** → **Functions** → **D1 bindings** → add binding name `DB` → database `assistanalytics`.
5. **Set secrets** — Pages → **Settings** → **Environment variables**:
   - `SESSION_SECRET` — long random string (production + preview)
   - `RESEND_API_KEY` — for magic-link and password-reset email (optional; without it, links are logged in dev)
   - `EMAIL_FROM` — verified sender in Resend (e.g. `Assist Analytics <noreply@yourdomain.com>`)
   - `APP_URL` — public site URL (e.g. `https://assistanalytics.pages.dev`) for links in emails
   - `OPENAI_API_KEY` — optional; enables **Whisper** audio transcription for Import from narration (Game Logs)

### Local API development

```bash
npm install
npm run db:migrate:local
npm run pages:dev
```

For Whisper transcription locally, create `.dev.vars` in the project root:

```
OPENAI_API_KEY=sk-...
```

Open the URL Wrangler prints (API routes under `/api/*` run as Pages Functions from the `functions/` folder).

### How cloud sync works

- **Sign up** with email + password, **magic link**, or **forgot password** reset email.
- **Invite others** — owners open **Team** for coach/parent invite links, member list, roles, and removal.
- **Parent access** — share the **parent link** (`?join=CODE&role=viewer`) or choose viewer when joining. Parents land on **Dashboard** with only **Focus & Film** and **Dashboard** tabs (read-only).
- **Player portal** — coaches open **Edit Player** → **Create player link** to share with an athlete. The player gets full read access to their stats, trends, benchmarks, and film. Teammates on the same team label show **box score stats only** (no film, tags, or metrics). Other teams in the workspace are hidden.
- **Auto-save** — edits debounce to the cloud (~1.5s). Failed saves queue locally and retry when back online.
- **Conflicts** — if two devices save at once, the header offers **Load cloud version**.
- **Local-only mode** — choose **Continue locally without cloud sync** on the login screen (same as pre-cloud behavior).

Export/import JSON backups still work for manual backups and migration.


## How to use

1. Start the app — a default player (Avery) with sample games loads on first visit.
2. Open **Roster** to see all players by team — use **Edit Player** to add team labels (e.g. `7th Grade Gold`, `Club Elite`). Players can belong to multiple teams in the same season.
3. Set the **current season** from the header badge (coaches/owners). Archive past seasons when done — archived stats stay available in season filters.
4. Use the **Player** dropdown (grouped by team) or click a name on the Roster to switch players.
5. Open **Game Logs**, click **+ Add Game**, pick which **team** the game was for, and enter box score stats and play-by-play.
6. Open **Team Night** to compare every player's box score from the same game date.
7. Paste a YouTube URL on the game card (or in the game form).
8. Use **Smart Film Room** to browse clips by structured event type.
9. Review **Dashboard** for last game, trends, and cumulative stats.
10. Use **Benchmarks** to compare averages against goals — click **Edit Targets** to customize.
11. Open **Stat Guide** for metric definitions.

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

- R2 nightly auto-backup exports
- Mobile quick-log UX for sideline entry
- AI-assisted play-by-play tagging from film transcripts

## Repository

https://github.com/chadcourtside/assistanalytics

## License

MIT — see [LICENSE](LICENSE).
