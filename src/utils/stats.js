import { normalizeGameStats } from './gameStats';

export function sumGameStats(games) {
  return games.reduce((acc, game) => {
    const stats = normalizeGameStats(game.stats);
    for (const key of Object.keys(stats)) {
      acc[key] = (acc[key] || 0) + stats[key];
    }
    return acc;
  }, {});
}

export function calcEFG(fgm, threePm, fga) {
  if (fga <= 0) return null;
  return (((fgm + 0.5 * threePm) / fga) * 100).toFixed(1);
}

export function calcAstTo(ast, tov) {
  return tov > 0 ? (ast / tov).toFixed(2) : ast;
}

export function calcPer(stat, mins, base) {
  return mins > 0 ? ((stat / mins) * base).toFixed(1) : 0;
}

export function seasonAverages(totals, gameCount) {
  const gms = gameCount || 1;
  return {
    mins: totals.mins / gms,
    pts: totals.pts / gms,
    tpPct: totals.threePa > 0 ? (totals.threePm / totals.threePa) * 100 : 0,
    ftPct: totals.fta > 0 ? (totals.ftm / totals.fta) * 100 : 0,
    efg: parseFloat(calcEFG(totals.fgm, totals.threePm, totals.fga) ?? 0),
    threePa: totals.threePa / gms,
    ast: totals.ast / gms,
    astHqpa: (totals.ast + (totals.hqpa || 0)) / gms,
    ptch: totals.ptch / gms,
    reb: totals.reb / gms,
    oreb: (totals.oreb || 0) / gms,
    blk: (totals.blk || 0) / gms,
    defl: (totals.defl || 0) / gms,
    foulsDrawn: (totals.foulsDrawn || 0) / gms,
    tov: totals.tov / gms,
    liveBallTov: (totals.liveBallTov || 0) / gms,
    astTo: totals.tov > 0 ? totals.ast / totals.tov : totals.ast,
  };
}

export function getBenchmarkMetricValue(metricKey, averages) {
  if (averages[metricKey] !== undefined) {
    return averages[metricKey];
  }
  return undefined;
}

/**
 * Parse a benchmark target string into a numeric threshold for status coloring.
 * Supports ranges, percentages, ratios (2:1+), ≤ caps, and "Near Zero".
 */
export function parseBenchmarkTarget(targetStr, options = {}) {
  if (!targetStr || typeof targetStr !== 'string') return null;

  const trimmed = targetStr.trim();
  const { isLowerBetter = false, metricKey = '' } = options;

  if (/near\s*zero/i.test(trimmed)) {
    return isLowerBetter || metricKey === 'liveBallTov' ? 0.25 : null;
  }

  const ratioMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*:\s*1\s*\+?$/);
  if (ratioMatch) {
    return parseFloat(ratioMatch[1]);
  }

  const pctRangeMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%/);
  if (pctRangeMatch) {
    return parseFloat(pctRangeMatch[2]);
  }

  const pctPlusMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*%\s*\+?$/);
  if (pctPlusMatch) {
    return parseFloat(pctPlusMatch[1]);
  }

  const rangeMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return parseFloat(rangeMatch[2]);
  }

  const plusMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*\+/);
  if (plusMatch) {
    return parseFloat(plusMatch[1]);
  }

  const leMatch = trimmed.match(/^[≤<]=?\s*(\d+(?:\.\d+)?)/);
  if (leMatch) {
    return parseFloat(leMatch[1]);
  }

  const numMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return parseFloat(numMatch[1]);
  }

  return null;
}

export function getBenchmarkStatusColor(currentVal, target12, isLowerBetter = false, metricKey = '') {
  const v = parseFloat(currentVal);
  const t = parseBenchmarkTarget(target12, { isLowerBetter, metricKey });

  if (isNaN(v) || t === null) {
    return 'bg-gray-100 text-gray-700';
  }

  if (isLowerBetter) {
    if (v <= t) return 'bg-green-100 text-green-800 font-bold';
    if (v <= t + 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-50 text-red-800';
  }

  if (v >= t) return 'bg-green-100 text-green-800 font-bold';
  if (v >= t * 0.75) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-50 text-gray-500';
}
