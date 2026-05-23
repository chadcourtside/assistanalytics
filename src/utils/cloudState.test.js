import { describe, it, expect } from 'vitest';
import { stateToCloudPayload, cloudPayloadToState } from './cloudState.js';

describe('cloudState', () => {
  it('round-trips app state fields used for cloud sync', () => {
    const state = {
      schemaVersion: 5,
      activePlayerId: 'player-1',
      meta: { lastExportAt: null },
      players: [{ id: 'player-1', displayName: 'Avery' }],
      games: [{ id: 'game-1', playerId: 'player-1', opponent: 'Hawks' }],
      benchmarkSets: [{ playerId: 'player-1', targets: [] }],
    };

    const payload = stateToCloudPayload(state);
    const restored = cloudPayloadToState(payload);

    expect(restored.activePlayerId).toBe('player-1');
    expect(restored.players).toHaveLength(1);
    expect(restored.games).toHaveLength(1);
    expect(restored.benchmarkSets).toHaveLength(1);
  });
});
