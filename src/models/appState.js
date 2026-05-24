export const SCHEMA_VERSION = 6;

export const STORAGE_KEY = 'assistanalytics-state';
export const LEGACY_GAMES_KEY = 'assistanalytics-games';
export const LEGACY_AVERY_KEY = 'averyGames';

export const DEFAULT_PLAYER_ID = 'player-avery-default';
export const DEFAULT_BENCHMARK_ID = 'benchmark-avery-default';

export function nowIso() {
  return new Date().toISOString();
}

export function createPlayerId() {
  return `player-${crypto.randomUUID()}`;
}

export function createBenchmarkId(playerId) {
  return `benchmark-${playerId}`;
}

export function createGameId() {
  return `game-${crypto.randomUUID()}`;
}
