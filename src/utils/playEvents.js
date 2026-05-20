import { parseTime } from './youtube';

/** Structured play event types used by Film Room filters. */
export const PLAY_EVENT_TYPES = {
  MAKE: 'make',
  MISS: 'miss',
  TWO_PT: 'twoPt',
  THREE_PT: 'threePt',
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
  { id: 'twoPt', label: '2PT', types: [PLAY_EVENT_TYPES.TWO_PT] },
  { id: 'threePt', label: '3PT', types: [PLAY_EVENT_TYPES.THREE_PT] },
  { id: 'assist', label: 'Assist', types: [PLAY_EVENT_TYPES.ASSIST] },
  { id: 'hqpa', label: 'HQPA', types: [PLAY_EVENT_TYPES.HQPA] },
  { id: 'paintTouch', label: 'Paint Touch', types: [PLAY_EVENT_TYPES.PAINT_TOUCH] },
  { id: 'turnover', label: 'Turnover', types: [PLAY_EVENT_TYPES.TURNOVER] },
  { id: 'liveBallTov', label: 'LB TOV', types: [PLAY_EVENT_TYPES.LIVE_BALL_TOV] },
  { id: 'rebound', label: 'Rebound', types: [PLAY_EVENT_TYPES.REBOUND] },
  { id: 'deflection', label: 'Deflection', types: [PLAY_EVENT_TYPES.DEFLECTION] },
  { id: 'steal', label: 'Steal', types: [PLAY_EVENT_TYPES.STEAL] },
  { id: 'other', label: 'Other', types: null },
];

const LINE_RE = /^\[?\s*(\d{1,2}:\d{2})\s*\]?\s*(.*)$/;

const THREE_PT_RE = /(?:^|\s)(?:3\s*-?\s*pt|three[- ]?pointer|3pt)(?:\s|$)|make\s*3|miss\s*3|made\s*3/i;
const TWO_PT_RE = /(?:^|\s)(?:2\s*-?\s*pt|two[- ]?pointer|2pt)(?:\s|$)|make\s*2|miss\s*2|made\s*2/i;

/**
 * Infer structured event types from free-text description.
 * Uses word boundaries to reduce false positives.
 */
export function inferPlayEventTypes(description) {
  if (!description || typeof description !== 'string') return [PLAY_EVENT_TYPES.OTHER];

  const lower = description.toLowerCase();
  const types = [];

  if (/\bmake\b|\bmade\b/.test(lower)) types.push(PLAY_EVENT_TYPES.MAKE);
  if (/\bmiss\b|\bmissed\b/.test(lower)) types.push(PLAY_EVENT_TYPES.MISS);
  if (THREE_PT_RE.test(lower)) types.push(PLAY_EVENT_TYPES.THREE_PT);
  if (TWO_PT_RE.test(lower)) types.push(PLAY_EVENT_TYPES.TWO_PT);

  if (/\bhqpa\b|clean entry/.test(lower)) types.push(PLAY_EVENT_TYPES.HQPA);
  if (/\bassist\b|\bassists\b/.test(lower)) types.push(PLAY_EVENT_TYPES.ASSIST);

  if (/paint touch|\bptch\b/.test(lower)) types.push(PLAY_EVENT_TYPES.PAINT_TOUCH);

  if (/\blb tov\b|live[- ]ball/.test(lower)) types.push(PLAY_EVENT_TYPES.LIVE_BALL_TOV);
  if (/\btov\b|\bturnover\b|\bdb tov\b/.test(lower) && !types.includes(PLAY_EVENT_TYPES.LIVE_BALL_TOV)) {
    types.push(PLAY_EVENT_TYPES.TURNOVER);
  }

  if (/\bdef\s*reb\b|defensive reb|\bdreb\b|\boreb\b/.test(lower)) {
    types.push(PLAY_EVENT_TYPES.REBOUND);
  } else if (/\breb\b|\brebound\b/.test(lower)) {
    types.push(PLAY_EVENT_TYPES.REBOUND);
  }

  if (/\bdefl\b|\bdeflection\b/.test(lower)) {
    types.push(PLAY_EVENT_TYPES.DEFLECTION);
  } else if (/\bdef\b/.test(lower) && !types.includes(PLAY_EVENT_TYPES.REBOUND)) {
    types.push(PLAY_EVENT_TYPES.DEFLECTION);
  }

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

/** Lines that did not match any known play tag. */
export function isUnclassifiedClip(clip) {
  const types = clip?.types ?? [];
  return types.length === 1 && types[0] === PLAY_EVENT_TYPES.OTHER;
}

export function playEventMatchesFilter(event, filterId) {
  if (filterId === 'all' || !filterId) return true;
  if (filterId === 'other') return isUnclassifiedClip(event);
  const filter = FILM_FILTERS.find((f) => f.id === filterId);
  if (!filter?.types) return true;
  return event.types.some((t) => filter.types.includes(t));
}

export function countClipsForFilter(clips, filterId) {
  if (!clips?.length) return 0;
  if (filterId === 'all') return clips.length;
  return clips.filter((c) => playEventMatchesFilter(c, filterId)).length;
}

export function normalizeGamePlayEvents(game) {
  const playByPlay = Array.isArray(game.playByPlay) ? game.playByPlay : [];
  const playEvents = playEventsFromPlayByPlay(playByPlay);
  return { playByPlay, playEvents };
}
