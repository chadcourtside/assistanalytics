import { describe, it, expect } from 'vitest';
import {
  parseTranscriptToSegments,
  normalizeSpeechToDescription,
  processNarrationTranscript,
  mergeSuggestionsIntoPlayByPlay,
  whisperSegmentsToTranscript,
} from './narrationImport.js';

describe('narrationImport', () => {
  it('parses WebVTT-style cues', () => {
    const raw = `WEBVTT

00:03:50.000 --> 00:03:52.000
make two paint touch

00:06:14.000 --> 00:06:16.000
assist`;
    const segments = parseTranscriptToSegments(raw);
    expect(segments).toHaveLength(2);
    expect(segments[0].time).toBe('3:50');
    expect(segments[0].text).toBe('make two paint touch');
  });

  it('parses bracket timestamps', () => {
    const segments = parseTranscriptToSegments('[6:50] live ball turnover');
    expect(segments[0].time).toBe('6:50');
  });

  it('normalizes spoken phrases to canonical tags', () => {
    expect(normalizeSpeechToDescription('make two paint touch').description).toBe(
      'Make 2 PT, Paint touch'
    );
    expect(normalizeSpeechToDescription('live ball turnover').description).toBe('LB TOV');
    expect(normalizeSpeechToDescription('hockey assist').description).toBe('2nd Assist');
    expect(normalizeSpeechToDescription('db tov').description).toBe('TOV');
    expect(normalizeSpeechToDescription('deflection').description).toBe('Def');
    expect(normalizeSpeechToDescription('scr ast').description).toBe('Screen assist');
  });

  it('builds suggestions from transcript', () => {
    const result = processNarrationTranscript('3:50 make two\n6:14 assist', {
      playerName: 'Avery',
    });
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(result.suggestions[0].line).toContain('Make 2 PT');
  });

  it('merges accepted lines into play-by-play', () => {
    const merged = mergeSuggestionsIntoPlayByPlay('1:00 Assist', ['3:50 Make 2 PT']);
    expect(merged).toBe('1:00 Assist\n3:50 Make 2 PT');
  });

  it('converts Whisper segments to WebVTT-style transcript', () => {
    const text = whisperSegmentsToTranscript([
      { start: 230, end: 232, text: ' make two paint touch' },
      { start: 374, end: 376, text: ' assist' },
    ]);
    expect(text).toContain('3:50 -->');
    expect(text).toContain('make two paint touch');
    expect(text).toContain('6:14 -->');
  });
});
