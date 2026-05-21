import { describe, it, expect } from 'vitest';
import { filterGamesByScope, getGameSeasonLabel } from './gameFilters.js';
import { GAME_TYPES } from '../constants/gameTypes.js';

describe('gameFilters', () => {
  const player = { season: '2025-26' };

  it('inherits season from player when game has none', () => {
    expect(getGameSeasonLabel({ season: '' }, player)).toBe('2025-26');
  });

  it('filters by player current season', () => {
    const games = [
      { id: '1', season: '2025-26', gameType: 'game' },
      { id: '2', season: '2024-25', gameType: 'game' },
      { id: '3', gameType: 'game' },
    ];
    const filtered = filterGamesByScope(games, player, { seasonFilter: 'player', gameTypeFilter: 'all' });
    expect(filtered.map((g) => g.id)).toEqual(['1', '3']);
  });

  it('filters by game type', () => {
    const games = [
      { id: '1', gameType: GAME_TYPES.GAME },
      { id: '2', gameType: GAME_TYPES.PRACTICE },
    ];
    const filtered = filterGamesByScope(games, player, {
      seasonFilter: 'all',
      gameTypeFilter: GAME_TYPES.PRACTICE,
    });
    expect(filtered.map((g) => g.id)).toEqual(['2']);
  });
});
