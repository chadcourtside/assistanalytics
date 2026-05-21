import { normalizeGameStats } from './gameStats';
import { inferPlayEventTypes, PLAY_EVENT_TYPES, parsePlayEventLine } from './playEvents';
import { parsePlayByPlayText } from './gameForm';

/** Box score keys that can be counted from tagged play-by-play lines. */
export const PBP_COUNTABLE_STATS = [
  'fgm',
  'fga',
  'threePm',
  'threePa',
  'ftm',
  'fta',
  'oreb',
  'dreb',
  'reb',
  'ast',
  'hqpa',
  'ptch',
  'tov',
  'liveBallTov',
  'stl',
  'defl',
  'blk',
  'pf',
  'foulsDrawn',
];

const STAT_LABELS = {
  fgm: 'FGM',
  fga: 'FGA',
  threePm: '3PM',
  threePa: '3PA',
  ftm: 'FTM',
  fta: 'FTA',
  oreb: 'OREB',
  dreb: 'DREB',
  reb: 'REB',
  ast: 'AST',
  hqpa: 'HQPA',
  ptch: 'PTCH',
  tov: 'TOV',
  liveBallTov: 'LB TOV',
  stl: 'STL',
  defl: 'DEFL',
  blk: 'BLK',
  pf: 'PF',
  foulsDrawn: 'FD',
};

export function createEmptyPlayByPlayCounts() {
  return Object.fromEntries(PBP_COUNTABLE_STATS.map((key) => [key, 0]));
}

function applyTypesToCounts(types, counts, rebGeneric) {
  if (types.includes(PLAY_EVENT_TYPES.NOTE)) return;

  const hasMakeFt = types.includes(PLAY_EVENT_TYPES.MAKE_FT);
  const hasMissFt = types.includes(PLAY_EVENT_TYPES.MISS_FT);

  if (hasMakeFt || hasMissFt) {
    counts.fta += 1;
    if (hasMakeFt) counts.ftm += 1;
    return;
  }

  const isThree = types.includes(PLAY_EVENT_TYPES.THREE_PT);
  const isTwo = types.includes(PLAY_EVENT_TYPES.TWO_PT);
  const isMake = types.includes(PLAY_EVENT_TYPES.MAKE);
  const isMiss = types.includes(PLAY_EVENT_TYPES.MISS);

  if (isThree) {
    counts.threePa += 1;
    counts.fga += 1;
    if (isMake) {
      counts.threePm += 1;
      counts.fgm += 1;
    }
  } else if (isTwo || isMake || isMiss) {
    counts.fga += 1;
    if (isMake && !isMiss) counts.fgm += 1;
  }

  if (types.includes(PLAY_EVENT_TYPES.OREB)) counts.oreb += 1;
  if (types.includes(PLAY_EVENT_TYPES.DREB)) counts.dreb += 1;
  if (
    types.includes(PLAY_EVENT_TYPES.REBOUND) &&
    !types.includes(PLAY_EVENT_TYPES.OREB) &&
    !types.includes(PLAY_EVENT_TYPES.DREB)
  ) {
    rebGeneric.count += 1;
  }

  if (types.includes(PLAY_EVENT_TYPES.ASSIST)) counts.ast += 1;
  if (types.includes(PLAY_EVENT_TYPES.HQPA)) counts.hqpa += 1;
  if (types.includes(PLAY_EVENT_TYPES.PAINT_TOUCH)) counts.ptch += 1;

  if (types.includes(PLAY_EVENT_TYPES.LIVE_BALL_TOV)) {
    counts.liveBallTov += 1;
    counts.tov += 1;
  } else if (types.includes(PLAY_EVENT_TYPES.TURNOVER)) {
    counts.tov += 1;
  }

  if (types.includes(PLAY_EVENT_TYPES.STEAL)) counts.stl += 1;
  if (types.includes(PLAY_EVENT_TYPES.DEFLECTION)) counts.defl += 1;
  if (types.includes(PLAY_EVENT_TYPES.BLOCK)) counts.blk += 1;
  if (types.includes(PLAY_EVENT_TYPES.PERSONAL_FOUL)) counts.pf += 1;
  if (types.includes(PLAY_EVENT_TYPES.FOUL_DRAWN)) counts.foulsDrawn += 1;
}

export function countStatsFromPlayByPlay(playByPlay) {
  const counts = createEmptyPlayByPlayCounts();
  const rebGeneric = { count: 0 };
  const lines = Array.isArray(playByPlay)
    ? playByPlay
    : parsePlayByPlayText(playByPlay);

  for (const line of lines) {
    const event = parsePlayEventLine(line);
    const types = event?.types ?? inferPlayEventTypes(line);
    applyTypesToCounts(types, counts, rebGeneric);
  }

  counts.reb = counts.oreb + counts.dreb + rebGeneric.count;
  return counts;
}

function countedValueForKey(key, counts) {
  return counts[key] ?? 0;
}

/** Compare entered box score stats with counts inferred from play-by-play tags. */
export function compareStatsToPlayByPlay(enteredStats, playByPlay) {
  const entered = normalizeGameStats(enteredStats);
  const counts = countStatsFromPlayByPlay(playByPlay);
  const mismatches = [];

  for (const key of PBP_COUNTABLE_STATS) {
    const enteredVal = entered[key] ?? 0;
    const countedVal = countedValueForKey(key, counts);

    if (enteredVal !== countedVal && (enteredVal > 0 || countedVal > 0)) {
      mismatches.push({
        key,
        label: STAT_LABELS[key] || key,
        entered: enteredVal,
        counted: countedVal,
      });
    }
  }

  return { counts, mismatches, hasPlayByPlay: (playByPlay?.length ?? 0) > 0 };
}

/** Merge play-by-play counts into stats (does not change mins, pts, plus/minus). */
export function applyPlayByPlayCountsToStats(currentStats, playByPlay) {
  const counts = countStatsFromPlayByPlay(playByPlay);
  const next = { ...normalizeGameStats(currentStats) };

  for (const key of PBP_COUNTABLE_STATS) {
    if (key === 'reb') {
      next.reb = counts.reb;
      next.oreb = counts.oreb;
      next.dreb = counts.dreb;
    } else {
      next[key] = counts[key];
    }
  }

  return normalizeGameStats(next);
}

export function getPlayByPlayStatLabel(key) {
  return STAT_LABELS[key] || key;
}
