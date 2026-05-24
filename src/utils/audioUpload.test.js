import { describe, it, expect } from 'vitest';
import { isAcceptedNarrationFile } from './audioUpload.js';

describe('audioUpload', () => {
  it('accepts common audio mime types', () => {
    expect(isAcceptedNarrationFile({ type: 'audio/m4a', name: 'memo.m4a', size: 1000 })).toBe(true);
    expect(isAcceptedNarrationFile({ type: 'audio/mpeg', name: 'x.mp3', size: 1000 })).toBe(true);
  });

  it('accepts by extension when mime is empty', () => {
    expect(isAcceptedNarrationFile({ type: '', name: 'sideline.wav', size: 1000 })).toBe(true);
  });

  it('rejects unknown types', () => {
    expect(isAcceptedNarrationFile({ type: 'application/pdf', name: 'x.pdf', size: 1000 })).toBe(
      false
    );
  });
});
