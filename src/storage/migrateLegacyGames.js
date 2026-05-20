import { createDefaultAppState } from '../data/defaultAppState';
import { createBenchmarkSet } from '../data/defaultBenchmarkTargets';
import {
  DEFAULT_PLAYER_ID,
  DEFAULT_BENCHMARK_ID,
  nowIso,
} from '../models/appState';
import { migrateLegacyGame } from '../utils/migrateGame';

/**
 * Migrate legacy games array (no players) into v1 AppState.
 */
export function migrateLegacyGamesArray(legacyGames) {
  const base = createDefaultAppState();
  const ts = nowIso();

  const games = (legacyGames || []).map((g, index) => {
    if (g.playerId) {
      return migrateLegacyGame(g, g.playerId);
    }
    return migrateLegacyGame(
      { ...g, id: g.id ?? index + 1 },
      DEFAULT_PLAYER_ID
    );
  });

  return {
    ...base,
    games,
    benchmarkSets: [createBenchmarkSet(DEFAULT_PLAYER_ID, DEFAULT_BENCHMARK_ID)],
    activePlayerId: DEFAULT_PLAYER_ID,
    players: base.players.map((p) => ({ ...p, updatedAt: ts })),
  };
}
