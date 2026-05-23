import { migrateState } from '../storage/migrateState';
import { DEFAULT_APP_META } from '../constants/gameTypes';

export function stateToCloudPayload(state) {
  return {
    schemaVersion: state.schemaVersion,
    meta: state.meta ?? DEFAULT_APP_META,
    activePlayerId: state.activePlayerId,
    players: state.players ?? [],
    games: state.games ?? [],
    benchmarkSets: state.benchmarkSets ?? [],
  };
}

export function cloudPayloadToState(payload) {
  if (!payload) return null;
  return migrateState(payload);
}
