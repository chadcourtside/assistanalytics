import { describe, it, expect } from 'vitest';
import { getPlayerStatBlurb, getStatEntry } from './statGlossary.js';

describe('player stat blurbs', () => {
  it('returns athlete-friendly blurbs for shooting efficiency metrics', () => {
    expect(getPlayerStatBlurb('ftPct')).toMatch(/free throw/i);
    expect(getPlayerStatBlurb('efg')).toMatch(/good shots|efficiency/i);
    expect(getPlayerStatBlurb('tpPct')).toMatch(/three/i);
  });

  it('returns blurbs for box score and hustle metrics', () => {
    for (const key of ['oreb', 'reb', 'blk', 'ast', 'stl', 'tov', 'astTo', 'foulsDrawn']) {
      const blurb = getPlayerStatBlurb(key);
      expect(blurb.length).toBeGreaterThan(10);
      expect(getStatEntry(key)?.playerBlurb).toBeTruthy();
    }
  });
});
