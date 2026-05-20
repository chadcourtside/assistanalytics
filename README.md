# Assist Analytics

A local-first basketball player development app for tracking game stats, development benchmarks, and film-linked play-by-play. Originally generated as a single-file Gemini prototype and stabilized into a modular Vite + React project.

## What it does

- **Dashboard** — Season totals, per-game box score, eFG%, per-24/32 minute rates, PDF export
- **Game Logs** — Play-by-play per game with YouTube timestamp links
- **Benchmarks** — Season averages compared to 4-month and 12-month development targets
- **Smart Film Room** — Filterable clip playlist with embedded YouTube playback

Data is stored in your browser (`localStorage`). No backend or account required.

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

1. Start the app — sample games load automatically on first visit.
2. Open **Game Logs** and paste a YouTube URL for a game.
3. Click timestamp links in play-by-play to jump to film, or use **Smart Film Room** to browse clips by type.
4. Review **Dashboard** for cumulative stats and print/PDF export.
5. Use **Benchmarks** to compare season averages against development goals.

## Known limitations

- **Read-only stats** — Box score and play-by-play data are seeded; only YouTube URLs are editable in the UI.
- **Player-specific branding** — UI still references the original player name ("Avery"); storage migrates from legacy key `averyGames` to `assistanalytics-games`.
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
