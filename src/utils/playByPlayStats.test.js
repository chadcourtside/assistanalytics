import { describe, it, expect } from 'vitest';
import {
  countStatsFromPlayByPlay,
  compareStatsToPlayByPlay,
  applyPlayByPlayCountsToStats,
} from './playByPlayStats.js';

describe('countStatsFromPlayByPlay', () => {
  it('counts shooting and paint touches from tagged lines', () => {
    const counts = countStatsFromPlayByPlay([
      '5:30 Make 3 PT',
      '1:46 Miss 2 PT, paint touch',
      '6:14 Assist',
      '8:12 Def Reb',
      '4:10 Make FT',
      '4:20 Miss FT',
    ]);

    expect(counts.fgm).toBe(1);
    expect(counts.fga).toBe(2);
    expect(counts.threePm).toBe(1);
    expect(counts.threePa).toBe(1);
    expect(counts.ftm).toBe(1);
    expect(counts.fta).toBe(2);
    expect(counts.ast).toBe(1);
    expect(counts.ptch).toBe(1);
    expect(counts.dreb).toBe(1);
    expect(counts.reb).toBe(1);
  });

  it('ignores custom notes', () => {
    const counts = countStatsFromPlayByPlay(['3:50 Note: Great hustle']);
    expect(counts.fgm).toBe(0);
    expect(counts.ptch).toBe(0);
  });
});

describe('compareStatsToPlayByPlay', () => {
  it('reports mismatches between box score and tags', () => {
    const { mismatches } = compareStatsToPlayByPlay(
      { fgm: 1, fga: 1, threePm: 1, threePa: 1 },
      ['5:30 Make 3 PT', '1:46 Miss 2 PT']
    );
    expect(mismatches.some((m) => m.key === 'fga')).toBe(true);
  });
});

describe('applyPlayByPlayCountsToStats', () => {
  it('overwrites countable stats from tags', () => {
    const next = applyPlayByPlayCountsToStats(
      { mins: 10, pts: 8, fgm: 0, fga: 0 },
      ['5:30 Make 3 PT']
    );
    expect(next.fgm).toBe(1);
    expect(next.mins).toBe(10);
    expect(next.pts).toBe(8);
  });
});
