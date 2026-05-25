import { getArchivedSeasons, getWorkspaceCurrentSeason } from './season';

/** Season label for a game — explicit on game, then player, then workspace current. */
export function getGameSeasonLabel(game, player, meta = null) {
  const gameSeason = (game?.season || '').trim();
  if (gameSeason) return gameSeason;

  const playerSeason = (player?.season || '').trim();
  if (playerSeason) return playerSeason;

  return getWorkspaceCurrentSeason(meta);
}

export function filterGamesByScope(games, player, scope = {}, meta = null) {
  const { seasonFilter = 'current' } = scope;
  const playerSeason = (player?.season || '').trim();
  const workspaceSeason = getWorkspaceCurrentSeason(meta);

  return games.filter((game) => {
    if (seasonFilter === 'all') return true;

    const gameSeason = getGameSeasonLabel(game, player, meta);

    if (seasonFilter === 'current') {
      const target = workspaceSeason || playerSeason;
      if (!target) return true;
      return gameSeason === target;
    }

    if (seasonFilter === 'player') {
      if (!playerSeason) return true;
      return gameSeason === playerSeason;
    }

    return gameSeason === seasonFilter;
  });
}

export function getSeasonFilterOptions(player, meta = null) {
  const options = [{ value: 'all', label: 'All seasons' }];
  const workspaceSeason = getWorkspaceCurrentSeason(meta);
  const playerSeason = (player?.season || '').trim();
  const archived = getArchivedSeasons(meta);

  if (workspaceSeason) {
    options.push({ value: 'current', label: `Current (${workspaceSeason})` });
  } else if (playerSeason) {
    options.push({ value: 'player', label: `Player season (${playerSeason})` });
  }

  const seen = new Set(options.map((o) => o.value));
  for (const season of archived) {
    if (seen.has(season)) continue;
    options.push({ value: season, label: `${season} (Archived)` });
    seen.add(season);
  }

  return options;
}
