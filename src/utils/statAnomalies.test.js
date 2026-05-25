import { describe, it, expect } from 'vitest';
import { detectGameAnomalies } from './statAnomalies.js';

describe('statAnomalies', () => {
  const baseline = [
    { stats: { pts: 8, ast: 2, ptch: 4, tov: 2, fgm: 3, fga: 6, threePm: 1, threePa: 2 } },
    { stats: { pts: 10, ast: 3, ptch: 5, tov: 1, fgm: 4, fga: 8, threePm: 1, threePa: 3 } },
    { stats: { pts: 6, ast: 1, ptch: 3, tov: 3, fgm: 2, fga: 5, threePm: 0, threePa: 1 } },
  ];

  it('flags a high scoring outlier', () => {
    const game = { stats: { pts: 22, ast: 2, ptch: 4, tov: 2, fgm: 9, fga: 12, threePm: 2, threePa: 3 } };
    const flags = detectGameAnomalies(game, baseline);
    expect(flags.some((f) => f.key === 'pts' && f.direction === 'high')).toBe(true);
  });

  it('returns empty with insufficient baseline', () => {
    const game = { stats: { pts: 30 } };
    expect(detectGameAnomalies(game, [baseline[0]])).toEqual([]);
  });
});
