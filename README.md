# Assist Analytics

A local-first **multi-player** basketball development app for tracking individual game stats, development benchmarks, and film-linked play-by-play. Each player has separate games, benchmarks, and film data.

## What it does

- **Players** — Add players and switch the active player from the header
- **Dashboard** — Season totals, per-game box score, eFG%, per-24/32 minute rates, PDF export (per active player)
- **Game Logs** — Play-by-play per game with YouTube timestamp links
- **Benchmarks** — Per-player development targets vs season averages
- **Smart Film Room** — Filterable clip playlist with embedded YouTube playback

Data is stored in your browser (`localStorage`, schema version 1). No backend or account required.

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 18 |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| PDF export | html2pdf.js |
| Storage | Browser localStorage |

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## How to use

1. Start the app — a default player (Avery) with sample games loads on first visit.
2. Use the **Player** dropdown in the header to switch players, or **+ Add Player** to create another.
3. Open **Game Logs** and paste a YouTube URL for a game.
4. Click timestamp links in play-by-play to jump to film, or use **Smart Film Room** to browse clips by type.
5. Review **Dashboard** for cumulative stats and print/PDF export.
6. Use **Benchmarks** to compare season averages against development goals.

## Known limitations

- **Read-only game stats** — Box score and play-by-play are seeded; only YouTube URLs are editable until Phase 0 game entry.
- **Legacy migration** — Old saves (`averyGames` or `assistanalytics-games`) migrate into the default Avery player on first load.
- **Custom metrics** — PTCH, HQPA, LB TOV, and DEFL are tracked but not formally defined in code (see [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md)).
- **Benchmark colors** — Non-numeric targets (e.g. "Near Zero", "2:1+") show neutral status; numeric targets drive green/yellow highlighting.
- **Film filters** — Keyword-based matching on play descriptions; may produce false positives (e.g. "def" in unrelated text).
- **YouTube** — Requires internet for video embeds and links.

## Next improvement ideas

- Game add/edit UI and JSON import/export
- Formal definitions for custom tracking stats
- Trend charts (season progression)
- Multi-player / roster support
- Smarter benchmark target parsing for ranges and ratios

## Repository

https://github.com/chadcourtside/assistanalytics

## License

MIT — see [LICENSE](LICENSE).
