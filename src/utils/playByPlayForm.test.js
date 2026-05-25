import { describe, it, expect } from 'vitest';
import {
  normalizePlayTimeInput,
  formatPlayByPlayLine,
  insertPlayByPlayLine,
  addSecondsToPlayTime,
  extractTimeFromPlayLine,
  extractDescriptionFromPlayLine,
  getRecentPlayByPlayLines,
} from './playByPlayForm.js';

describe('playByPlayForm', () => {
  it('normalizes time input', () => {
    expect(normalizePlayTimeInput('3:5')).toBe('3:05');
    expect(normalizePlayTimeInput('350')).toBe('3:50');
    expect(normalizePlayTimeInput('')).toBe('');
  });

  it('formats line with time prefix', () => {
    expect(formatPlayByPlayLine('3:50', 'Make 3 PT')).toBe('3:50 Make 3 PT');
    expect(formatPlayByPlayLine('', 'Assist')).toBe('Assist');
  });

  it('inserts at end when no textarea', () => {
    expect(
      insertPlayByPlayLine({
        currentText: '0:25 Assist',
        timeStr: '3:50',
        description: 'Make 3 PT',
      })
    ).toBe('0:25 Assist\n3:50 Make 3 PT\n');
  });

  it('inserts at cursor position', () => {
    const textarea = {
      selectionStart: 4,
      selectionEnd: 4,
    };
    const result = insertPlayByPlayLine({
      currentText: '0:25 Assist\n',
      timeStr: '1:00',
      description: 'HQPA',
      textarea,
    });
    expect(result).toBe('0:25\n1:00 HQPA\n Assist\n');
  });

  it('adds seconds to clip time', () => {
    expect(addSecondsToPlayTime('3:50', 15)).toBe('4:05');
    expect(addSecondsToPlayTime('0:55', 30)).toBe('1:25');
  });

  it('extracts time and description from a line', () => {
    expect(extractTimeFromPlayLine('3:50 Make 3 PT')).toBe('3:50');
    expect(extractDescriptionFromPlayLine('3:50 Make 3 PT')).toBe('Make 3 PT');
  });

  it('returns recent non-empty lines', () => {
    const text = '0:25 Assist\n3:50 Make 3 PT\n\n4:10 Note: hedge';
    expect(getRecentPlayByPlayLines(text, 2)).toEqual(['3:50 Make 3 PT', '4:10 Note: hedge']);
  });
});
