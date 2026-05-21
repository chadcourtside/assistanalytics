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
    playerBlurb: 'Take open threes when they are there — we track attempts to see if you are hunting good looks.',
  },
  {
    id: 'ftm',
    abbrev: 'FTM',
    name: 'Free Throws Made',
    category: 'standard',
    description: 'Made free throws.',
  },
  {
    id: 'fta',
    abbrev: 'FTA',
    name: 'Free Throw Attempts',
    category: 'standard',
    description: 'Attempted free throws. FTM must be ≤ FTA.',
  },
  {
    id: 'ftPct',
    abbrev: 'FT%',
    name: 'Free Throw Percentage',
    category: 'standard',
    formula: 'FTM / FTA × 100',
    description: 'Free throw shooting percentage for the game or season.',
    playerBlurb: 'Knock down your free throws — they are free points when you get to the line.',
  },
  {
    id: 'efg',
    abbrev: 'eFG%',
    name: 'Effective Field Goal Percentage',
    category: 'standard',
    formula: '(FGM + 0.5 × 3PM) / FGA × 100',
    description: 'Shooting efficiency that gives extra weight to three-pointers.',
    playerBlurb: 'Take good shots — threes count extra, so open looks and rim attempts both help your efficiency.',
  },
  {
    id: 'oreb',
    abbrev: 'OREB',
    name: 'Offensive Rebounds',
    category: 'standard',
    description: 'Rebounds on the offensive glass. OREB + DREB should match total REB when all three are logged.',
    playerBlurb: 'Crash the offensive glass — extra possessions help your team score.',
  },
  {
    id: 'dreb',
    abbrev: 'DREB',
    name: 'Defensive Rebounds',
    category: 'standard',
    description: 'Rebounds on the defensive glass.',
    playerBlurb: 'Finish the play with a defensive board — box out and secure the ball.',
  },
  {
    id: 'reb',
    abbrev: 'REB',
    name: 'Rebounds',
    category: 'standard',
    description: 'Total rebounds. If OREB and DREB are entered but REB is left blank, REB is computed as their sum.',
    playerBlurb: 'Win the battle on the glass — rebounding gives your team extra chances.',
  },
  {
    id: 'blk',
    abbrev: 'BLK',
    name: 'Blocks',
    category: 'standard',
    description: 'Blocked shots.',
    playerBlurb: 'Protect the rim — a good block stops an easy score without fouling.',
  },
  {
    id: 'ast',
    abbrev: 'AST',
    name: 'Assists',
    category: 'standard',
    description: 'Passes that directly lead to a made basket.',
    playerBlurb: 'Find open teammates — a good pass is as valuable as a bucket.',
  },
  {
    id: 'stl',
    abbrev: 'STL',
    name: 'Steals',
    category: 'standard',
    description: 'Steals of the basketball from the opponent.',
    playerBlurb: 'Anticipate and jump the pass — steals create fast-break chances.',
  },
  {
    id: 'tov',
    abbrev: 'TOV',
    name: 'Turnovers',
    category: 'standard',
    description: 'Total turnovers committed.',
    playerBlurb: 'Take care of the ball — every turnover is a chance we give the other team.',
  },
  {
    id: 'astTo',
    abbrev: 'AST/TO',
    name: 'Assist-to-Turnover Ratio',
    category: 'standard',
    formula: 'Assists ÷ Turnovers (when TOV > 0)',
    description: 'When turnovers are zero, the dashboard shows assist count instead of a ratio.',
    playerBlurb: 'Make plays without giving the ball away — more assists than turnovers is the goal.',
  },
  {
    id: 'pf',
    abbrev: 'PF',
    name: 'Personal Fouls',
    category: 'standard',
    description: 'Personal fouls committed.',
    playerBlurb: 'Play hard without fouling — stay disciplined on defense.',
  },
  {
    id: 'foulsDrawn',
    abbrev: 'FD',
    name: 'Fouls Drawn',
    category: 'standard',
    description:
      'Fouls drawn on the opponent (and-ones, shooting fouls drawn, etc.). Tag in play-by-play as “Foul drawn” for film clips.',
    playerBlurb: 'Attack so defenders have to foul you — drawn fouls mean free throws.',
  },
  {
    id: 'ptch',
    abbrev: 'PTCH',
    name: 'Paint Touches',
    category: 'custom',
    description:
      'Touches in or around the paint tracked manually per game. Used as a development indicator for getting downhill or into the lane.',
    playerBlurb: 'Get into the paint before you shoot — paint touches mean you attacked the basket.',
  },
  {
    id: 'hqpa',
    abbrev: 'HQPA',
    name: 'High-Quality Potential Assist',
    category: 'custom',
    description:
      'A potential assist that creates an open or advantaged shot: layup, open catch-and-shoot three, close-range paint touch, or a clear advantage shot within 0–1 dribbles. Tracked separately from traditional assists.',
    playerBlurb:
      'Your pass set up a great look — even if it did not become an official assist.',
  },
  {
    id: 'secondAst',
    abbrev: '2ND AST',
    name: 'Second Assist',
    category: 'custom',
    description:
      'The pass that leads to the assist (hockey assist) — one pass before the made basket.',
    playerBlurb: 'The pass before the assist counts — you started the play that led to a score.',
  },
  {
    id: 'screenAst',
    abbrev: 'SCR AST',
    name: 'Screen Assist',
    category: 'custom',
    description:
      'A screen that directly leads to a made basket or an advantaged shot for a teammate.',
    playerBlurb: 'Your screen freed up a teammate for a good look or score.',
  },
  {
    id: 'liveBallTov',
    abbrev: 'LB TOV',
    name: 'Initiator Live-Ball Turnover',
    category: 'custom',
    description:
      'Live-ball turnovers charged to the player as the primary initiator (e.g. bad pass, ball-handling). Tracked separately from total turnovers.',
    playerBlurb: 'A turnover where the other team gets a fast break — protect the ball.',
  },
  {
    id: 'defl',
    abbrev: 'DEFL',
    name: 'Deflections',
    category: 'custom',
    description: 'Deflections of passes or dribbles — a hustle/activity metric.',
    playerBlurb: 'Get a hand on the ball — deflections show active defense and effort.',
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
    id: 'tpPct',
    abbrev: '3PT%',
    name: 'Three-Point Percentage',
    category: 'standard',
    formula: '3PM / 3PA × 100',
    description: 'Season or game three-point shooting percentage.',
    playerBlurb: 'Take open threes with confidence — we track makes vs attempts.',
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
  'ft%': 'ftPct',
  'efg%': 'efg',
  '2nd ast': 'secondAst',
  'second assist': 'secondAst',
  'scr ast': 'screenAst',
  'screen assist': 'screenAst',
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

export function getPlayerStatBlurb(statIdOrKey) {
  const entry = getStatEntry(statIdOrKey);
  if (!entry) return '';
  return entry.playerBlurb || entry.description || entry.name;
}

export const STANDARD_STATS = STAT_GLOSSARY.filter((e) => e.category === 'standard');
export const CUSTOM_STATS = STAT_GLOSSARY.filter((e) => e.category === 'custom');
