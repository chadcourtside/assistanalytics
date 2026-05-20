# Development Notes

## Architecture

```mermaid
flowchart TB
  subgraph storage [localStorage]
    state[assistanalytics-state schema v2]
  end
  subgraph react [React app]
    useApp[useAppState]
    App[App.jsx]
    tabs[Tab components]
  end
  useApp --> state
  App --> useApp
  App --> PlayerSelector
  useApp --> tabs
```

- **Entry:** `index.html` → `src/main.jsx` → `src/App.jsx`
- **State:** Single `AppState` blob with `players`, `games`, `benchmarkSets`, `activePlayerId`
- **Legacy:** Reads `averyGames` or `assistanalytics-games` once, migrates to v2, then uses `assistanalytics-state` only
- **No router** — tab switching via `activeTab` string state
- **Device transfer:** JSON export/import via header buttons (`src/utils/importExport.js`)

## AppState (schema version 2)

```js
{
  schemaVersion: 2,
  activePlayerId: string | null,
  players: Player[],
  games: Game[],
  benchmarkSets: BenchmarkSet[]
}
```

- **Player** — `id`, `firstName`, `displayName`, optional profile fields, timestamps
- **Game** — `id`, `playerId`, `date`, `opponent`, `stats`, `playByPlay`, `playEvents`, `competition`, `videoUrl`, timestamps
- **BenchmarkSet** — one per player; `targets[]` drives Benchmarks tab (editable in UI)
- **PlayEvent** — `{ timeStr, seconds, description, types[], raw }` parsed from play-by-play lines

Migration: `src/storage/migrateState.js` upgrades v1 → v2 (adds `playEvents` to games).

Default player id: `player-avery-default`. Seed games: `game-avery-1` … `game-avery-3`.

## File map

| Path | Purpose |
|------|---------|
| `src/hooks/useAppState.js` | Load/save AppState, CRUD, import/export, benchmark targets |
| `src/utils/importExport.js` | JSON backup serialize, validate, merge/replace |
| `src/utils/playEvents.js` | Parse play-by-play → structured event types |
| `src/utils/gameTrends.js` | Per-game series for dashboard charts |
| `src/storage/migrateState.js` | Schema upgrades + game normalization |
| `src/components/RosterTab.jsx` | Team-grouped roster with quick actions |
| `src/components/EditPlayerModal.jsx` | Edit player team, jersey, name |
| `src/utils/roster.js` | Group by team, roster summary stats |
| `src/components/DataTransferMenu.jsx` | Export / Import header UI |
| `src/components/LastGamePanel.jsx` | Dashboard last-game snapshot |
| `src/components/TrendCharts.jsx` | SVG season trend charts |
| `src/components/GameFormModal.jsx` | Add/edit game form |
| `src/utils/gameForm.js` | Form validation and stat field definitions |
| `src/storage/loadState.js` | Load + migrate legacy storage |
| `src/data/statGlossary.js` | Stat definitions for Stat Guide |
| `src/utils/stats.js` | Aggregations, eFG%, benchmark parsing |
| `src/utils/stats.test.js` | Vitest unit tests |

## Stat glossary (UI)

- **Source of truth:** `src/data/statGlossary.js`
- **Inline help:** `StatHelp` with `statId` matching glossary `id`

## Play events & Film Room

Play-by-play lines like `3:50 Make 2 PT, paint touch` are parsed into structured types (`make`, `paintTouch`, etc.) in `playEvents.js`. Film Room filters match on `types[]` instead of raw substring search, reducing false positives on words like "def".

Recommended tags when logging: **Make/Miss 2 PT**, **Make/Miss 3 PT**, **Assist**, **HQPA**, **Paint touch**, **TOV**, **LB TOV**, **Def reb**, **Def**, **Steal**. Film Room filters: All, Make, Miss, 2PT, 3PT, Assist, HQPA, Paint Touch, Turnover, LB TOV, Rebound, Deflection, Steal.

## Benchmark parsing

`parseBenchmarkTarget()` in `stats.js` handles:

- Ranges (`8 - 14` → upper bound)
- Percent ranges (`35 - 38%+`)
- Ratios (`2:1+` → 2.0)
- Caps (`≤ 2`)
- Near Zero (→ 0.25 for live-ball TOV / lower-is-better metrics)

## Fragile areas

1. **Import merge** — Adds entities by id only; duplicate players with different ids are not deduplicated by name
2. **Hooks** — `FilmRoomTab` must call hooks before any early return
3. **Schema** — Bump `schemaVersion` and extend `migrateState.js` when shape changes

## Cloudflare Pages

- Build output: `dist/`
- SPA fallback: `public/_redirects`
- Config stub: `wrangler.toml`

## Next steps

1. Optional cloud sync (Cloudflare D1/KV)
2. Duplicate-last-game / faster mobile game entry
3. TypeScript migration + broader test coverage

## Original prototype

`archive/gemini-original-index.html` — single-file CDN app with key `averyGames`.
