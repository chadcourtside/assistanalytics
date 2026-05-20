import { describe, it, expect } from 'vitest';
import {
  parsePlayEventLine,
  inferPlayEventTypes,
  playEventMatchesFilter,
  isUnclassifiedClip,
  countClipsForFilter,
  PLAY_EVENT_TYPES,
} from './playEvents.js';

describe('inferPlayEventTypes', () => {
  it('tags 3PT and make on three-point makes', () => {
    const types = inferPlayEventTypes('5:30 Make 3 PT');
    expect(types).toContain(PLAY_EVENT_TYPES.MAKE);
    expect(types).toContain(PLAY_EVENT_TYPES.THREE_PT);
    expect(types).not.toContain(PLAY_EVENT_TYPES.TWO_PT);
  });

  it('tags 2PT and miss on two-point misses', () => {
    const types = inferPlayEventTypes('1:46 Miss 2 PT, paint touch');
    expect(types).toContain(PLAY_EVENT_TYPES.MISS);
    expect(types).toContain(PLAY_EVENT_TYPES.TWO_PT);
    expect(types).toContain(PLAY_EVENT_TYPES.PAINT_TOUCH);
  });

  it('keeps HQPA separate from assist-only lines', () => {
    expect(inferPlayEventTypes('6:14 Assist')).toContain(PLAY_EVENT_TYPES.ASSIST);
    expect(inferPlayEventTypes('6:14 Assist')).not.toContain(PLAY_EVENT_TYPES.HQPA);
  });

  it('tags clean entry as HQPA', () => {
    const types = inferPlayEventTypes('8:54 Clean entry, assist');
    expect(types).toContain(PLAY_EVENT_TYPES.HQPA);
    expect(types).toContain(PLAY_EVENT_TYPES.ASSIST);
  });

  it('tags LB TOV without generic turnover', () => {
    const types = inferPlayEventTypes('6:50 LB TOV');
    expect(types).toContain(PLAY_EVENT_TYPES.LIVE_BALL_TOV);
    expect(types).not.toContain(PLAY_EVENT_TYPES.TURNOVER);
  });

  it('tags DB TOV as turnover', () => {
    expect(inferPlayEventTypes('10:42 DB TOV')).toContain(PLAY_EVENT_TYPES.TURNOVER);
  });

  it('tags Def Reb as rebound not deflection', () => {
    const types = inferPlayEventTypes('8:12 Def Reb');
    expect(types).toContain(PLAY_EVENT_TYPES.REBOUND);
    expect(types).not.toContain(PLAY_EVENT_TYPES.DEFLECTION);
  });

  it('tags standalone Def as deflection', () => {
    const types = inferPlayEventTypes('9:50 Def');
    expect(types).toContain(PLAY_EVENT_TYPES.DEFLECTION);
    expect(types).not.toContain(PLAY_EVENT_TYPES.REBOUND);
  });
});

describe('playEventMatchesFilter', () => {
  const clip = { types: [PLAY_EVENT_TYPES.MAKE, PLAY_EVENT_TYPES.THREE_PT] };

  it('matches 3PT filter without matching assist', () => {
    expect(playEventMatchesFilter(clip, 'threePt')).toBe(true);
    expect(playEventMatchesFilter(clip, 'assist')).toBe(false);
  });
});

describe('parsePlayEventLine', () => {
  it('parses bracketed timestamps', () => {
    const event = parsePlayEventLine('[3:50] Make 2 PT');
    expect(event.timeStr).toBe('3:50');
    expect(event.types).toContain(PLAY_EVENT_TYPES.MAKE);
  });
});

describe('unclassified and counts', () => {
  it('flags unknown lines as other-only', () => {
    const clip = { types: [PLAY_EVENT_TYPES.OTHER] };
    expect(isUnclassifiedClip(clip)).toBe(true);
    expect(playEventMatchesFilter(clip, 'other')).toBe(true);
    expect(playEventMatchesFilter(clip, 'make')).toBe(false);
  });

  it('counts clips per filter', () => {
    const clips = [
      { types: [PLAY_EVENT_TYPES.MAKE] },
      { types: [PLAY_EVENT_TYPES.OTHER] },
      { types: [PLAY_EVENT_TYPES.MAKE, PLAY_EVENT_TYPES.THREE_PT] },
    ];
    expect(countClipsForFilter(clips, 'all')).toBe(3);
    expect(countClipsForFilter(clips, 'make')).toBe(2);
    expect(countClipsForFilter(clips, 'other')).toBe(1);
  });
});
