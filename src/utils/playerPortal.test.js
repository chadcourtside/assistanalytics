import { describe, it, expect } from 'vitest';
import { buildPlayerPortalPayload } from '../../shared/playerPortalCore.js';

describe('buildPlayerPortalPayload', () => {
  const state = {
    schemaVersion: 6,
    players: [
      { id: 'p1', displayName: 'Avery', teams: ['Gold', 'Club'] },
      { id: 'p2', displayName: 'Jordan', teams: ['Gold'] },
      { id: 'p3', displayName: 'Sam', teams: ['Blue'] },
      { id: 'p4', displayName: 'Riley', teams: ['Club'] },
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
      {
        id: 'g4',
        playerId: 'p4',
        opponent: 'Storm',
        stats: { mins: 9, pts: 5, fgm: 2, fga: 3, threePm: 1, threePa: 1, ftm: 0, fta: 0, reb: 1, ast: 0, tov: 1 },
        playByPlay: ['club only'],
      },
    ],
    benchmarkSets: [{ playerId: 'p1', targets: [] }],
  };

  it('includes full game data for the linked player only', () => {
    const payload = buildPlayerPortalPayload(state, 'p1');
    expect(payload.games).toHaveLength(1);
    expect(payload.games[0].playByPlay).toHaveLength(1);
    expect(payload.games[0].videoUrl).toContain('youtube');
    expect(payload.teamLabels).toEqual(['Gold', 'Club']);
  });

  it('includes teammate box scores without film or tags', () => {
    const payload = buildPlayerPortalPayload(state, 'p1');
    expect(payload.teammates.map((t) => t.player.displayName).sort()).toEqual(['Jordan', 'Riley']);
    const jordan = payload.teammates.find((t) => t.player.displayName === 'Jordan');
    expect(jordan.games[0].stats.pts).toBe(4);
    expect(jordan.games[0].playByPlay).toBeUndefined();
    expect(jordan.sharedTeams).toEqual(['Gold']);
  });

  it('excludes players from other teams', () => {
    const payload = buildPlayerPortalPayload(state, 'p1');
    expect(payload.teammates.some((t) => t.player.displayName === 'Sam')).toBe(false);
  });
});
