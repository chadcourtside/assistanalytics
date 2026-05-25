import { normalizeGameStats } from './gameStats';
import { calcEFG } from './stats';

/** @typedef {{ key: string, label: string, higherIsBetter: boolean }} AnomalyMetric */

/** @type {AnomalyMetric[]} */
export const ANOMALY_METRICS = [
  { key: 'pts', label: 'PTS', higherIsBetter: true },
  { key: 'ast', label: 'AST', higherIsBetter: true },
  { key: 'ptch', label: 'PTCH', higherIsBetter: true },
  { key: 'reb', label: 'REB', higherIsBetter: true },
  { key: 'stl', label: 'STL', higherIsBetter: true },
  { key: 'blk', label: 'BLK', higherIsBetter: true },
  { key: 'plusMinus', label: '+/-', higherIsBetter: true },
  { key: 'tov', label: 'TOV', higherIsBetter: false },
  { key: 'liveBallTov', label: 'LB TOV', higherIsBetter: false },
  { key: 'efg', label: 'eFG%', higherIsBetter: true },
];

function metricValue(key, stats) {
  if (key === 'efg') {
    const v = calcEFG(stats.fgm, stats.threePm, stats.fga);
    return v == null ? null : parseFloat(v, 10);
  }
  return stats[key] ?? 0;
}

export function computeStatBaselines(games) {
  if (!games?.length) return { averages: {}, gameCount: 0 };

  const sums = Object.fromEntries(ANOMALY_METRICS.map((m) => [m.key, 0]));
  const counts = Object.fromEntries(ANOMALY_METRICS.map((m) => [m.key, 0]));

  for (const game of games) {
    const stats = normalizeGameStats(game.stats);
    for (const metric of ANOMALY_METRICS) {
      const value = metricValue(metric.key, stats);
      if (value == null) continue;
      sums[metric.key] += value;
      counts[metric.key] += 1;
    }
  }

  const averages = {};
  for (const metric of ANOMALY_METRICS) {
    averages[metric.key] = counts[metric.key] ? sums[metric.key] / counts[metric.key] : 0;
  }

  return { averages, gameCount: games.length };
}

function classifyOutlier(value, average, metric) {
  if (value == null || Number.isNaN(value)) return null;

  const avg = average ?? 0;
  if (avg === 0 && value === 0) return null;

  const spread = Math.max(metric.key === 'efg' ? 8 : 2, Math.abs(avg) * 0.45);

  if (metric.higherIsBetter) {
    if (value >= avg + spread && (avg === 0 ? value >= 3 : value >= avg * 1.45)) {
      return {
        direction: 'high',
        message: value >= avg * 1.8 ? `Big ${metric.label} game` : `High ${metric.label}`,
      };
    }
    if (avg >= 2 && value <= avg - spread && value <= avg * 0.55) {
      return { direction: 'low', message: `Low ${metric.label}` };
    }
  } else if (value >= avg + spread && value >= Math.max(2, avg * 1.45)) {
    return { direction: 'high', message: `High ${metric.label}` };
  }

  return null;
}

/**
 * Compare one game to a baseline set (typically other games in the current filter).
 * @returns {Array<{ key, label, value, average, direction, message, higherIsBetter }>}
 */
export function detectGameAnomalies(game, baselineGames, { minBaselineGames = 2, maxResults = 5 } = {}) {
  if (!game || !baselineGames?.length || baselineGames.length < minBaselineGames) {
    return [];
  }

  const { averages } = computeStatBaselines(baselineGames);
  const stats = normalizeGameStats(game.stats);
  const anomalies = [];

  for (const metric of ANOMALY_METRICS) {
    const value = metricValue(metric.key, stats);
    const outlier = classifyOutlier(value, averages[metric.key], metric);
    if (!outlier) continue;
    anomalies.push({
      key: metric.key,
      label: metric.label,
      higherIsBetter: metric.higherIsBetter,
      value,
      average: averages[metric.key],
      ...outlier,
    });
  }

  const rank = (a) => (a.direction === 'high' && a.higherIsBetter ? 0 : a.direction === 'low' ? 1 : 2);
  return anomalies.sort((a, b) => rank(a) - rank(b)).slice(0, maxResults);
}

/** Map of stat key → anomaly for table cell highlighting. */
export function anomaliesByKey(anomalies) {
  return Object.fromEntries((anomalies || []).map((a) => [a.key, a]));
}
