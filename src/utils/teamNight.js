import { normalizeGameStats } from './gameStats';
import { getGameSeasonLabel } from './gameFilters';

function dateKey(game) {
  const date = (game?.date || '').trim();
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const competition = (game?.competition || '').trim();
  if (competition) return `comp:${competition}`;
  return game?.createdAt?.slice(0, 10) || 'unknown';
}

function dateLabel(key) {
  if (key.startsWith('comp:')) return key.slice(5);
  if (key === 'unknown') return 'Unknown date';
  const parsed = new Date(`${key}T12:00:00`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return key;
}

/** Group all roster games by calendar date (or competition label). */
export function groupGamesByNight(games, players) {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const nights = new Map();

  for (const game of games) {
    const key = dateKey(game);
    if (!nights.has(key)) {
      nights.set(key, { key, label: dateLabel(key), entries: [] });
    }
    const player = playerMap.get(game.playerId);
    nights.get(key).entries.push({
      game,
      player,
      stats: normalizeGameStats(game.stats),
    });
  }

  return [...nights.values()]
    .map((night) => ({
      ...night,
      entries: night.entries.sort((a, b) =>
        (a.player?.displayName || '').localeCompare(b.player?.displayName || '')
      ),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

export function filterTeamNightsBySeason(nights, meta, seasonLabel) {
  if (!seasonLabel || seasonLabel === 'all') return nights;
  return nights
    .map((night) => ({
      ...night,
      entries: night.entries.filter(({ game, player }) => {
        const label = getGameSeasonLabel(game, player, meta);
        if (seasonLabel === 'current') {
          const current = (meta?.currentSeason || '').trim();
          if (!current) return true;
          return label === current;
        }
        return label === seasonLabel;
      }),
    }))
    .filter((night) => night.entries.length > 0);
}
