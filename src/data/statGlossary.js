/**
 * Stat definitions used in the UI glossary and inline help.
 * Custom stats reflect this app's tracking conventions — not official NBA definitions.
 */

export const STAT_GLOSSARY = [
  {
    id: 'mins',
    abbrev: 'MIN',
    name: 'Minutes',
    category: 'standard',
    description: 'Playing time for the game.',
  },
  {
    id: 'pts',
    abbrev: 'PTS',
    name: 'Points',
    category: 'standard',
    description: 'Total points scored.',
  },
  {
    id: 'fgm',
    abbrev: 'FGM',
    name: 'Field Goals Made',
    category: 'standard',
    description: 'Shots made from the field (includes 2PT and 3PT).',
  },
  {
    id: 'fga',
    abbrev: 'FGA',
    name: 'Field Goal Attempts',
    category: 'standard',
    description: 'Shots attempted from the field.',
  },
  {
    id: 'threePm',
    abbrev: '3PM',
    name: 'Three-Pointers Made',
    category: 'standard',
    description: 'Made three-point field goals. Must be ≤ FGM.',
  },
  {
    id: 'threePa',
    abbrev: '3PA',
    name: 'Three-Point Attempts',
    category: 'standard',
    description: 'Attempted three-point field goals.',
  },
  {
    id: 'efg',
    abbrev: 'eFG%',
    name: 'Effective Field Goal Percentage',
    category: 'standard',
    formula: '(FGM + 0.5 × 3PM) / FGA × 100',
    description: 'Shooting efficiency that gives extra weight to three-pointers.',
  },
  {
    id: 'oreb',
    abbrev: 'OREB',
    name: 'Offensive Rebounds',
    category: 'standard',
    description: 'Rebounds on the offensive glass. OREB + DREB should match total REB when all three are logged.',
  },
  {
    id: 'dreb',
    abbrev: 'DREB',
    name: 'Defensive Rebounds',
    category: 'standard',
    description: 'Rebounds on the defensive glass.',
  },
  {
    id: 'reb',
    abbrev: 'REB',
    name: 'Rebounds',
    category: 'standard',
    description: 'Total rebounds. If OREB and DREB are entered but REB is left blank, REB is computed as their sum.',
  },
  {
    id: 'blk',
    abbrev: 'BLK',
    name: 'Blocks',
    category: 'standard',
    description: 'Blocked shots.',
  },
  {
    id: 'ast',
    abbrev: 'AST',
    name: 'Assists',
    category: 'standard',
    description: 'Passes that directly lead to a made basket.',
  },
  {
    id: 'stl',
    abbrev: 'STL',
    name: 'Steals',
    category: 'standard',
    description: 'Steals of the basketball from the opponent.',
  },
  {
    id: 'tov',
    abbrev: 'TOV',
    name: 'Turnovers',
    category: 'standard',
    description: 'Total turnovers committed.',
  },
  {
    id: 'astTo',
    abbrev: 'AST/TO',
    name: 'Assist-to-Turnover Ratio',
    category: 'standard',
    formula: 'Assists ÷ Turnovers (when TOV > 0)',
    description: 'When turnovers are zero, the dashboard shows assist count instead of a ratio.',
  },
  {
    id: 'pf',
    abbrev: 'PF',
    name: 'Personal Fouls',
    category: 'standard',
    description: 'Personal fouls committed.',
  },
  {
    id: 'foulsDrawn',
    abbrev: 'FD',
    name: 'Fouls Drawn',
    category: 'standard',
    description:
      'Fouls drawn on the opponent (and-ones, shooting fouls drawn, etc.). Tag in play-by-play as “Foul drawn” for film clips.',
  },
  {
    id: 'ptch',
    abbrev: 'PTCH',
    name: 'Paint Touches',
    category: 'custom',
    description:
      'Touches in or around the paint tracked manually per game. Used as a development indicator for getting downhill or into the lane.',
  },
  {
    id: 'hqpa',
    abbrev: 'HQPA',
    name: 'High-Quality Play Assist',
    category: 'custom',
    description:
      'Plays that create advantage but may not be a traditional assist (e.g. hockey assist, screen assist). Counted separately and combined with assists in benchmarks as AST + HQPA.',
  },
  {
    id: 'liveBallTov',
    abbrev: 'LB TOV',
    name: 'Initiator Live-Ball Turnover',
    category: 'custom',
    description:
      'Live-ball turnovers charged to the player as the primary initiator (e.g. bad pass, ball-handling). Tracked separately from total turnovers.',
  },
  {
    id: 'defl',
    abbrev: 'DEFL',
    name: 'Deflections',
    category: 'custom',
    description: 'Deflections of passes or dribbles — a hustle/activity metric.',
  },
  {
    id: 'plusMinus',
    abbrev: '+/-',
    name: 'Plus/Minus',
    category: 'custom',
    description:
      'Point differential while on court, entered manually per game in this app. Not calculated from lineup data.',
  },
  {
    id: 'astHqpa',
    abbrev: 'AST + HQPA',
    name: 'Assists plus High-Quality Play Assists',
    category: 'custom',
    formula: '(Assists + HQPA) per game average',
    description: 'Combined playmaking impact metric used on the Benchmarks tab.',
  },
  {
    id: 'tpPct',
    abbrev: '3PT%',
    name: 'Three-Point Percentage',
    category: 'standard',
    formula: '3PM / 3PA × 100',
    description: 'Season or game three-point shooting percentage.',
  },
  {
    id: 'perRate',
    abbrev: 'Per 24 / 32',
    name: 'Per-Minute Rate',
    category: 'standard',
    formula: '(Stat ÷ Minutes) × 24 or 32',
    description: 'Projects counting stats to a full 24- or 32-minute game for comparison.',
  },
];

const byId = new Map(STAT_GLOSSARY.map((e) => [e.id, e]));

const aliases = {
  'paint tch': 'ptch',
  'lb to': 'liveBallTov',
  'a/to': 'astTo',
  'ast:to ratio': 'astTo',
  '3pt%': 'tpPct',
  'efg%': 'efg',
  'ast + hqpa': 'astHqpa',
  'initiator lb tov': 'liveBallTov',
  fd: 'foulsDrawn',
  'fouls drawn': 'foulsDrawn',
};

export function getStatEntry(statIdOrKey) {
  if (!statIdOrKey) return null;
  const key = String(statIdOrKey).trim();
  if (byId.has(key)) return byId.get(key);
  const lower = key.toLowerCase();
  if (aliases[lower]) return byId.get(aliases[lower]);
  const byAbbrev = STAT_GLOSSARY.find(
    (e) => e.abbrev.toLowerCase() === lower || e.name.toLowerCase() === lower
  );
  return byAbbrev ?? null;
}

export function formatStatTooltip(entry) {
  if (!entry) return '';
  const parts = [entry.name];
  if (entry.formula) parts.push(entry.formula);
  parts.push(entry.description);
  if (entry.category === 'custom') {
    parts.push('(Custom metric for this app — define consistently when logging.)');
  }
  return parts.join(' — ');
}

export const STANDARD_STATS = STAT_GLOSSARY.filter((e) => e.category === 'standard');
export const CUSTOM_STATS = STAT_GLOSSARY.filter((e) => e.category === 'custom');
