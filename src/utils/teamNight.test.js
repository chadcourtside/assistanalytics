import { describe, it, expect } from 'vitest';
import { groupGamesByNight, filterTeamNightsBySeason } from './teamNight.js';

describe('teamNight', () => {
  const players = [
    { id: 'p1', displayName: 'Alex', season: '2025-26' },
    { id: 'p2', displayName: 'Blake', season: '2025-26' },
  ];

  it('groups games on the same date', () => {
    const games = [
      { id: 'g1', playerId: 'p1', date: '2025-01-10', stats: { pts: 10 } },
      { id: 'g2', playerId: 'p2', date: '2025-01-10', stats: { pts: 8 } },
      { id: 'g3', playerId: 'p1', date: '2025-01-12', stats: { pts: 12 } },
    ];
    const nights = groupGamesByNight(games, players);
    expect(nights).toHaveLength(2);
    expect(nights[0].entries).toHaveLength(1);
    expect(nights[1].entries).toHaveLength(2);
  });

  it('filters nights by current season', () => {
    const games = [
      { id: 'g1', playerId: 'p1', date: '2025-01-10', season: '2025-26', stats: {} },
      { id: 'g2', playerId: 'p2', date: '2025-01-10', season: '2024-25', stats: {} },
    ];
    const nights = groupGamesByNight(games, players);
    const filtered = filterTeamNightsBySeason(nights, { currentSeason: '2025-26' }, 'current');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].entries).toHaveLength(1);
  });
});
