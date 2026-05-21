import { normalizeGameStats, sortGamesOldestFirst } from './gameStats';
import { calcEFG } from './stats';

export const TREND_METRICS = [
  { key: 'pts', label: 'Points', format: (v) => v.toFixed(0) },
  { key: 'efg', label: 'eFG%', format: (v) => `${v.toFixed(0)}%` },
  { key: 'ftPct', label: 'FT%', format: (v) => `${v.toFixed(0)}%` },
  { key: 'hqpa', label: 'HQPA', format: (v) => v.toFixed(1) },
  { key: 'secondAst', label: '2nd Assists', format: (v) => v.toFixed(1) },
  { key: 'ptch', label: 'Paint Touches', format: (v) => v.toFixed(1) },
  { key: 'tpPct', label: '3PT %', format: (v) => `${v.toFixed(0)}%` },
  { key: 'oreb', label: 'OREB', format: (v) => v.toFixed(1) },
  { key: 'blk', label: 'Blocks', format: (v) => v.toFixed(1) },
  { key: 'defl', label: 'Deflections', format: (v) => v.toFixed(1) },
  { key: 'tov', label: 'Turnovers', format: (v) => v.toFixed(1) },
];

function metricValue(key, stats) {
  switch (key) {
    case 'tpPct':
      return stats.threePa > 0 ? (stats.threePm / stats.threePa) * 100 : 0;
    case 'ftPct':
      return stats.fta > 0 ? (stats.ftm / stats.fta) * 100 : 0;
    case 'efg':
      return parseFloat(calcEFG(stats.fgm, stats.threePm, stats.fga) ?? 0);
    default:
      return stats[key] ?? 0;
  }
}

export function buildTrendSeries(games, metricKey) {
  const sorted = sortGamesOldestFirst(games);
  return sorted.map((game, index) => {
    const stats = normalizeGameStats(game.stats);
    const value = metricValue(metricKey, stats);
    const label = game.opponent?.length > 10
      ? `${game.opponent.slice(0, 9)}…`
      : game.opponent || `G${index + 1}`;

    return {
      label,
      date: game.date || '',
      value: Number.isFinite(value) ? value : 0,
    };
  });
}
