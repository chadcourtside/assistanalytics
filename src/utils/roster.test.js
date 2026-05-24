import { describe, it, expect } from 'vitest';
import { groupPlayersByTeam, getTeamList, NO_TEAM_LABEL } from './roster.js';

describe('roster', () => {
  const players = [
    { id: '1', displayName: 'Zoe', teams: ['Gold'] },
    { id: '2', displayName: 'Amy', teams: ['Gold'] },
    { id: '3', displayName: 'Ben', teams: [] },
    { id: '4', displayName: 'Chris', teams: ['Gold', 'Club'] },
  ];

  it('groups players by team with unassigned bucket', () => {
    const teams = getTeamList(players);
    expect(teams).toContain('Gold');
    expect(teams).toContain(NO_TEAM_LABEL);
    const grouped = groupPlayersByTeam(players);
    expect(grouped.find((g) => g.team === 'Gold').players).toHaveLength(3);
  });

  it('filters to a single team', () => {
    const grouped = groupPlayersByTeam(players, 'Gold');
    expect(grouped).toHaveLength(1);
    expect(grouped[0].team).toBe('Gold');
    expect(grouped[0].players).toHaveLength(3);
  });

  it('lists a multi-team player under each team', () => {
    const grouped = groupPlayersByTeam(players);
    expect(grouped.find((g) => g.team === 'Gold').players.some((p) => p.id === '4')).toBe(true);
    expect(grouped.find((g) => g.team === 'Club').players.some((p) => p.id === '4')).toBe(true);
  });
});
