import { describe, it, expect } from 'vitest';
import { filterGamesByScope, getGameSeasonLabel } from './gameFilters.js';

describe('gameFilters', () => {
  const player = { season: '2025-26' };

  it('inherits season from player when game has none', () => {
    expect(getGameSeasonLabel({ season: '' }, player)).toBe('2025-26');
  });

  it('filters by workspace current season', () => {
    const meta = { currentSeason: '2025-26' };
    const games = [
      { id: '1', season: '2025-26' },
      { id: '2', season: '2024-25' },
    ];
    const filtered = filterGamesByScope(games, player, { seasonFilter: 'current' }, meta);
    expect(filtered.map((g) => g.id)).toEqual(['1']);
  });

  it('filters by player current season', () => {
    const games = [
      { id: '1', season: '2025-26' },
      { id: '2', season: '2024-25' },
      { id: '3' },
    ];
    const filtered = filterGamesByScope(games, player, { seasonFilter: 'player' });
    expect(filtered.map((g) => g.id)).toEqual(['1', '3']);
  });
});
