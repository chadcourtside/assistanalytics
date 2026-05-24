import { describe, it, expect } from 'vitest';
import {
  calcPointsFromShooting,
  formatGameTitle,
  formatGameSubtitle,
  formatGameDateDisplay,
  normalizeGameStats,
} from './gameStats.js';

describe('calcPointsFromShooting', () => {
  it('derives pts from twos, threes, and free throws', () => {
    expect(calcPointsFromShooting(4, 1, 2)).toBe(11);
  });
});

describe('normalizeGameStats', () => {
  it('sums oreb and dreb into reb when reb omitted', () => {
    const s = normalizeGameStats({ oreb: 2, dreb: 3 });
    expect(s.oreb).toBe(2);
    expect(s.dreb).toBe(3);
    expect(s.reb).toBe(5);
  });

  it('includes blk and foulsDrawn', () => {
    const s = normalizeGameStats({ blk: 1, foulsDrawn: 2, fd: 99 });
    expect(s.blk).toBe(1);
    expect(s.foulsDrawn).toBe(2);
  });

  it('includes playmaking stats', () => {
    const s = normalizeGameStats({ hqpa: 2, secondAst: 1, screenAst: 3 });
    expect(s.hqpa).toBe(2);
    expect(s.secondAst).toBe(1);
    expect(s.screenAst).toBe(3);
  });
});

describe('game display labels', () => {
  const player = { displayName: 'Avery', teams: ['Courtside Elite'] };

  it('uses player team vs opponent in title', () => {
    expect(
      formatGameTitle({ opponent: 'Coyotes', team: '' }, player)
    ).toBe('Courtside Elite vs Coyotes');
  });

  it('falls back to display name when no team', () => {
    expect(
      formatGameTitle({ opponent: 'Coyotes' }, { displayName: 'Avery', teams: [] })
    ).toBe('Avery vs Coyotes');
  });

  it('prefers game.team over player teams', () => {
    expect(
      formatGameTitle({ opponent: 'Hawks', team: 'All-Stars' }, player)
    ).toBe('All-Stars vs Hawks');
  });

  it('formats ISO date in subtitle', () => {
    const sub = formatGameSubtitle(
      { date: '2025-03-15', opponent: 'Coyotes', result: 'W 65-42' },
      { mins: 12 }
    );
    expect(sub).toContain('Mar');
    expect(sub).toContain('2025');
    expect(sub).toContain('W 65-42');
    expect(sub).toContain('12 min');
  });

  it('uses competition when date is a tournament label', () => {
    expect(
      formatGameDateDisplay({ date: '', competition: 'Lakes Tournament' })
    ).toBe('Lakes Tournament');
  });
});
