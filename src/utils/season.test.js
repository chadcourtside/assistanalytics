import { describe, it, expect } from 'vitest';
import {
  archiveSeason,
  getArchivedSeasons,
  getWorkspaceCurrentSeason,
  setWorkspaceCurrentSeason,
} from './season.js';

describe('season utils', () => {
  it('reads current workspace season', () => {
    expect(getWorkspaceCurrentSeason({ currentSeason: '2025-26' })).toBe('2025-26');
    expect(getWorkspaceCurrentSeason({})).toBeNull();
  });

  it('archives a season and clears current when matching', () => {
    const meta = { currentSeason: '2024-25', archivedSeasons: [] };
    const result = archiveSeason(meta, '2024-25');
    expect(result.error).toBeUndefined();
    expect(getArchivedSeasons(result.meta)).toEqual(['2024-25']);
    expect(getWorkspaceCurrentSeason(result.meta)).toBeNull();
  });

  it('sets current season', () => {
    const next = setWorkspaceCurrentSeason({}, '2025-26');
    expect(getWorkspaceCurrentSeason(next)).toBe('2025-26');
  });
});
