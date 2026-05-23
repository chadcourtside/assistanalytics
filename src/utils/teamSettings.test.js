import { describe, it, expect } from 'vitest';
import { formatJoinedDate, TEAM_ROLE_META } from './teamSettings.js';

describe('teamSettings', () => {
  it('formats joined dates', () => {
    const formatted = formatJoinedDate('2026-05-22T12:00:00.000Z');
    expect(formatted).toMatch(/2026/);
  });

  it('defines access summaries for each role', () => {
    expect(TEAM_ROLE_META.owner.summary).toMatch(/team settings/i);
    expect(TEAM_ROLE_META.viewer.summary).toMatch(/read-only/i);
  });
});
