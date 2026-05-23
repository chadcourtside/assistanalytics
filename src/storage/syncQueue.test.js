import { describe, it, expect } from 'vitest';
import { isRetryableSyncError, shouldRetryQueue } from './syncQueue.js';

describe('syncQueue', () => {
  it('does not retry conflicts or auth errors', () => {
    expect(isRetryableSyncError({ status: 409 })).toBe(false);
    expect(isRetryableSyncError({ status: 403 })).toBe(false);
    expect(isRetryableSyncError({ status: 500 })).toBe(true);
  });

  it('respects retry backoff', () => {
    const entry = {
      state: { players: [] },
      attempts: 0,
      lastAttemptAt: new Date().toISOString(),
    };
    expect(shouldRetryQueue(entry)).toBe(false);
  });
});
