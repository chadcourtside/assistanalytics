import { GAME_TYPES } from '../constants/gameTypes';

/** Season label for a game — explicit on game or inherited from player. */
export function getGameSeasonLabel(game, player) {
  const gameSeason = (game?.season || '').trim();
  if (gameSeason) return gameSeason;
  return (player?.season || '').trim() || null;
}

export function filterGamesByScope(games, player, scope = {}) {
  const { seasonFilter = 'all', gameTypeFilter = 'all' } = scope;
  const playerSeason = (player?.season || '').trim();

  return games.filter((game) => {
    if (gameTypeFilter !== 'all') {
      const type = game.gameType || GAME_TYPES.GAME;
      if (type !== gameTypeFilter) return false;
    }

    if (seasonFilter === 'all') return true;

    const gameSeason = getGameSeasonLabel(game, player);
    if (seasonFilter === 'player') {
      if (!playerSeason) return true;
      return gameSeason === playerSeason;
    }

    return gameSeason === seasonFilter;
  });
}

export function getSeasonFilterOptions(player) {
  const options = [{ value: 'all', label: 'All seasons' }];
  const playerSeason = (player?.season || '').trim();
  if (playerSeason) {
    options.push({ value: 'player', label: `Current (${playerSeason})` });
  }
  return options;
}
