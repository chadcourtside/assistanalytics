import { describe, it, expect } from 'vitest';
import { groupPlayersByTeam, getTeamList, NO_TEAM_LABEL } from './roster.js';

describe('roster', () => {
  const players = [
    { id: '1', displayName: 'Zoe', team: 'Gold' },
    { id: '2', displayName: 'Amy', team: 'Gold' },
    { id: '3', displayName: 'Ben', team: '' },
  ];

  it('groups players by team with unassigned bucket', () => {
    const teams = getTeamList(players);
    expect(teams).toContain('Gold');
    expect(teams).toContain(NO_TEAM_LABEL);
    const grouped = groupPlayersByTeam(players);
    expect(grouped.find((g) => g.team === 'Gold').players).toHaveLength(2);
  });

  it('filters to a single team', () => {
    const grouped = groupPlayersByTeam(players, 'Gold');
    expect(grouped).toHaveLength(1);
    expect(grouped[0].team).toBe('Gold');
  });
});
