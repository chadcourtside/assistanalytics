import { describe, it, expect } from 'vitest';
import { parseBenchmarkTarget, getBenchmarkStatusColor } from './stats.js';
import { parsePlayEventLine } from './playEvents.js';
import {
  validateImportData,
  mergeAppStates,
  replaceAppState,
} from './importExport.js';

describe('parseBenchmarkTarget', () => {
  it('parses numeric ranges using upper bound', () => {
    expect(parseBenchmarkTarget('8 - 14')).toBe(14);
  });

  it('parses ratio targets like 2:1+', () => {
    expect(parseBenchmarkTarget('2:1+')).toBe(2);
  });

  it('parses percent ranges', () => {
    expect(parseBenchmarkTarget('35 - 38%+')).toBe(38);
  });

  it('parses Near Zero for lower-is-better metrics', () => {
    expect(parseBenchmarkTarget('Near Zero', { isLowerBetter: true, metricKey: 'liveBallTov' })).toBe(0.25);
  });
});

describe('getBenchmarkStatusColor', () => {
  it('colors ratio metric green when on target', () => {
    expect(getBenchmarkStatusColor(2.1, '2:1+', false, 'astTo')).toContain('green');
  });
});

describe('playEvents', () => {
  it('parses timestamp lines', () => {
    const event = parsePlayEventLine('0:25 Assist, paint touch');
    expect(event.timeStr).toBe('0:25');
    expect(event.types).toContain('assist');
    expect(event.types).toContain('paintTouch');
  });

  it('tags LB TOV separately from generic turnover', () => {
    const event = parsePlayEventLine('6:50 LB TOV');
    expect(event.types).toContain('liveBallTov');
    expect(event.types).not.toContain('turnover');
  });
});

describe('importExport', () => {
  const sample = {
    assistanalyticsExport: true,
    players: [{ id: 'p1', displayName: 'Kid A' }],
    games: [{ id: 'g1', playerId: 'p1', opponent: 'Team X', stats: {}, playByPlay: [] }],
    benchmarkSets: [{ id: 'b1', playerId: 'p1', targets: [] }],
  };

  it('validates good backup files', () => {
    const { valid } = validateImportData(sample);
    expect(valid).toBe(true);
  });

  it('rejects invalid backup files', () => {
    const { valid } = validateImportData({ foo: 'bar' });
    expect(valid).toBe(false);
  });

  it('merges new games without duplicating ids', () => {
    const local = {
      schemaVersion: 2,
      activePlayerId: 'p1',
      players: sample.players,
      games: sample.games,
      benchmarkSets: sample.benchmarkSets,
    };
    const imported = {
      ...sample,
      games: [
        ...sample.games,
        { id: 'g2', playerId: 'p1', opponent: 'Team Y', stats: {}, playByPlay: [] },
      ],
    };
    const merged = mergeAppStates(local, imported);
    expect(merged.games).toHaveLength(2);
  });

  it('replaces local state on replace import', () => {
    const local = {
      schemaVersion: 2,
      activePlayerId: 'old',
      players: [{ id: 'old', displayName: 'Old' }],
      games: [],
      benchmarkSets: [],
    };
    const next = replaceAppState(sample);
    expect(next.players[0].id).toBe('p1');
  });
});
