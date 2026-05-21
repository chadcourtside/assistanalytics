import { describe, it, expect } from 'vitest';
import { getPlayerStatBlurb, getStatEntry } from './statGlossary.js';

describe('player stat blurbs', () => {
  it('returns athlete-friendly blurbs for shooting efficiency metrics', () => {
    expect(getPlayerStatBlurb('ftPct')).toMatch(/free throw/i);
    expect(getPlayerStatBlurb('efg')).toMatch(/good shots|efficiency/i);
    expect(getPlayerStatBlurb('tpPct')).toMatch(/three/i);
  });

  it('defines HQPA as high-quality potential assists', () => {
    const entry = getStatEntry('hqpa');
    expect(entry.name).toMatch(/Potential Assist/i);
    expect(entry.description).toMatch(/open or advantaged shot/i);
    expect(entry.playerBlurb).toBeTruthy();
  });

  it('returns blurbs for playmaking and box score metrics', () => {
    for (const key of [
      'oreb',
      'reb',
      'blk',
      'ast',
      'stl',
      'tov',
      'astTo',
      'foulsDrawn',
      'secondAst',
      'screenAst',
    ]) {
      const blurb = getPlayerStatBlurb(key);
      expect(blurb.length).toBeGreaterThan(10);
      expect(getStatEntry(key)?.playerBlurb).toBeTruthy();
    }
  });
});
