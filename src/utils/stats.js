export function sumGameStats(games) {
  return games.reduce((acc, game) => {
    for (const key in game.stats) {
      acc[key] = (acc[key] || 0) + game.stats[key];
    }
    return acc;
  }, {});
}

export function calcEFG(fgm, tpm, fga) {
  if (fga <= 0) return null;
  return (((fgm + 0.5 * tpm) / fga) * 100).toFixed(1);
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
    tpPct: totals.tpa > 0 ? (totals.tpm / totals.tpa) * 100 : 0,
    tpa: totals.tpa / gms,
    ast: totals.ast / gms,
    astHqpa: (totals.ast + (totals.hqpa || 0)) / gms,
    ptch: totals.ptch / gms,
    reb: ((totals.oreb || 0) + (totals.dreb || 0)) / gms,
    defl: (totals.defl || 0) / gms,
    tov: totals.tov / gms,
    lbTov: (totals.lbTov || 0) / gms,
    astTo: totals.tov > 0 ? totals.ast / totals.tov : totals.ast,
  };
}

/**
 * Parse a benchmark target string into a comparable number when possible.
 * Returns null for non-numeric targets (ranges, "Near Zero", ratios like "2:1+").
 */
export function parseBenchmarkTarget(targetStr) {
  if (!targetStr || typeof targetStr !== 'string') return null;

  const trimmed = targetStr.trim();
  if (/near\s*zero/i.test(trimmed)) return null;
  if (trimmed.includes(':')) return null;

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

export function getBenchmarkStatusColor(currentVal, target12, isLowerBetter = false) {
  const v = parseFloat(currentVal);
  const t = parseBenchmarkTarget(target12);

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
