import { describe, it, expect } from 'vitest';
import {
  formatTeamLabels,
  getPlayerTeams,
  getSharedTeamLabels,
  normalizeTeamList,
  playersShareTeam,
} from './playerTeams.js';

describe('playerTeams', () => {
  it('reads teams array and dedupes', () => {
    expect(getPlayerTeams({ teams: [' Gold ', 'Gold', 'Club'] })).toEqual(['Gold', 'Club']);
  });

  it('falls back to legacy team string', () => {
    expect(getPlayerTeams({ team: '7th Grade Gold' })).toEqual(['7th Grade Gold']);
  });

  it('detects shared teams between players', () => {
    const a = { teams: ['School Varsity', 'Club Elite'] };
    const b = { teams: ['Club Elite', 'AAU'] };
    expect(playersShareTeam(a, b)).toBe(true);
    expect(getSharedTeamLabels(a, b)).toEqual(['Club Elite']);
  });

  it('normalizes team list input', () => {
    expect(normalizeTeamList(['  A ', 'B', 'A', ''])).toEqual(['A', 'B']);
  });

  it('formats labels for display', () => {
    expect(formatTeamLabels(['School', 'Club'])).toBe('School · Club');
  });
});
