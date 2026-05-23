import { describe, it, expect } from 'vitest';
import { buildPlayerPortalPayload } from '../../shared/playerPortalCore.js';

describe('buildPlayerPortalPayload', () => {
  const state = {
    schemaVersion: 5,
    players: [
      { id: 'p1', displayName: 'Avery', team: 'Gold' },
      { id: 'p2', displayName: 'Jordan', team: 'Gold' },
      { id: 'p3', displayName: 'Sam', team: 'Blue' },
    ],
    games: [
      {
        id: 'g1',
        playerId: 'p1',
        opponent: 'Hawks',
        stats: { mins: 10, pts: 8, fgm: 3, fga: 5, threePm: 1, threePa: 2, ftm: 0, fta: 0, reb: 2, ast: 1, tov: 1 },
        playByPlay: ['1:00 Make 2 PT'],
        videoUrl: 'https://youtube.com/watch?v=abc',
      },
      {
        id: 'g2',
        playerId: 'p2',
        opponent: 'Coyotes',
        stats: { mins: 12, pts: 4, fgm: 2, fga: 4, threePm: 0, threePa: 0, ftm: 0, fta: 0, reb: 1, ast: 0, tov: 2 },
        playByPlay: ['2:00 Assist'],
        videoUrl: 'https://youtube.com/watch?v=def',
      },
      {
        id: 'g3',
        playerId: 'p3',
        opponent: 'Thrive',
        stats: { mins: 8, pts: 6, fgm: 3, fga: 3, threePm: 0, threePa: 0, ftm: 0, fta: 0, reb: 0, ast: 1, tov: 0 },
        playByPlay: ['secret'],
      },
    ],
    benchmarkSets: [{ playerId: 'p1', targets: [] }],
  };

  it('includes full game data for the linked player only', () => {
    const payload = buildPlayerPortalPayload(state, 'p1');
    expect(payload.games).toHaveLength(1);
    expect(payload.games[0].playByPlay).toHaveLength(1);
    expect(payload.games[0].videoUrl).toContain('youtube');
  });

  it('includes teammate box scores without film or tags', () => {
    const payload = buildPlayerPortalPayload(state, 'p1');
    expect(payload.teammates).toHaveLength(1);
    expect(payload.teammates[0].player.displayName).toBe('Jordan');
    expect(payload.teammates[0].games[0].stats.pts).toBe(4);
    expect(payload.teammates[0].games[0].playByPlay).toBeUndefined();
    expect(payload.teammates[0].games[0].videoUrl).toBeUndefined();
  });

  it('excludes players from other teams', () => {
    const payload = buildPlayerPortalPayload(state, 'p1');
    expect(payload.teammates.some((t) => t.player.displayName === 'Sam')).toBe(false);
  });
});
