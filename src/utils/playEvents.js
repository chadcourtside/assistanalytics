import { parseTime } from './youtube';

/** Structured play event types used by Film Room filters. */
export const PLAY_EVENT_TYPES = {
  MAKE: 'make',
  MISS: 'miss',
  ASSIST: 'assist',
  HQPA: 'hqpa',
  PAINT_TOUCH: 'paintTouch',
  TURNOVER: 'turnover',
  LIVE_BALL_TOV: 'liveBallTov',
  REBOUND: 'rebound',
  DEFLECTION: 'deflection',
  STEAL: 'steal',
  OTHER: 'other',
};

export const FILM_FILTERS = [
  { id: 'all', label: 'All', types: null },
  { id: 'make', label: 'Make', types: [PLAY_EVENT_TYPES.MAKE] },
  { id: 'miss', label: 'Miss', types: [PLAY_EVENT_TYPES.MISS] },
  { id: 'assist', label: 'Assist', types: [PLAY_EVENT_TYPES.ASSIST, PLAY_EVENT_TYPES.HQPA] },
  { id: 'paintTouch', label: 'Paint Touch', types: [PLAY_EVENT_TYPES.PAINT_TOUCH] },
  { id: 'turnover', label: 'Turnover', types: [PLAY_EVENT_TYPES.TURNOVER, PLAY_EVENT_TYPES.LIVE_BALL_TOV] },
  { id: 'rebDef', label: 'Reb/Def', types: [PLAY_EVENT_TYPES.REBOUND, PLAY_EVENT_TYPES.DEFLECTION] },
  { id: 'steal', label: 'Steal', types: [PLAY_EVENT_TYPES.STEAL] },
];

const LINE_RE = /^\[?\s*(\d{1,2}:\d{2})\s*\]?\s*(.*)$/;

/**
 * Infer structured event types from free-text description.
 * Uses word boundaries to reduce false positives (e.g. "def" in unrelated words).
 */
export function inferPlayEventTypes(description) {
  if (!description || typeof description !== 'string') return [PLAY_EVENT_TYPES.OTHER];

  const lower = description.toLowerCase();
  const types = [];

  if (/\bmake\b|\bmade\b/.test(lower)) types.push(PLAY_EVENT_TYPES.MAKE);
  if (/\bmiss\b|\bmissed\b/.test(lower)) types.push(PLAY_EVENT_TYPES.MISS);
  if (/\bassist\b|\bassists\b/.test(lower)) types.push(PLAY_EVENT_TYPES.ASSIST);
  if (/\bhqpa\b/.test(lower)) types.push(PLAY_EVENT_TYPES.HQPA);
  if (/paint touch|\bptch\b/.test(lower)) types.push(PLAY_EVENT_TYPES.PAINT_TOUCH);
  if (/\blb tov\b|live[- ]ball/.test(lower)) types.push(PLAY_EVENT_TYPES.LIVE_BALL_TOV);
  if (/\btov\b|\bturnover\b/.test(lower) && !types.includes(PLAY_EVENT_TYPES.LIVE_BALL_TOV)) {
    types.push(PLAY_EVENT_TYPES.TURNOVER);
  }
  if (/\breb\b|\brebound\b/.test(lower)) types.push(PLAY_EVENT_TYPES.REBOUND);
  if (/\bdefl\b|\bdeflection\b|\bdef\b/.test(lower)) types.push(PLAY_EVENT_TYPES.DEFLECTION);
  if (/\bsteal\b|\bstl\b/.test(lower)) types.push(PLAY_EVENT_TYPES.STEAL);

  return types.length > 0 ? types : [PLAY_EVENT_TYPES.OTHER];
}

export function parsePlayEventLine(line) {
  if (!line || typeof line !== 'string') return null;
  const trimmed = line.trim();
  const match = trimmed.match(LINE_RE);
  if (!match) return null;

  const timeStr = match[1];
  const description = match[2].trim();
  const types = inferPlayEventTypes(description);

  return {
    timeStr,
    seconds: parseTime(timeStr),
    description,
    types,
    raw: trimmed,
  };
}

export function playEventsFromPlayByPlay(playByPlay) {
  if (!Array.isArray(playByPlay)) return [];
  return playByPlay.map(parsePlayEventLine).filter(Boolean);
}

export function playEventMatchesFilter(event, filterId) {
  if (filterId === 'all' || !filterId) return true;
  const filter = FILM_FILTERS.find((f) => f.id === filterId);
  if (!filter?.types) return true;
  return event.types.some((t) => filter.types.includes(t));
}

export function normalizeGamePlayEvents(game) {
  const playByPlay = Array.isArray(game.playByPlay) ? game.playByPlay : [];
  const playEvents =
    Array.isArray(game.playEvents) && game.playEvents.length > 0
      ? game.playEvents
      : playEventsFromPlayByPlay(playByPlay);

  return { playByPlay, playEvents };
}
