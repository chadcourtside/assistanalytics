import { SCHEMA_VERSION } from '../models/appState';
import { normalizeGameStats } from '../utils/gameStats';
import { playEventsFromPlayByPlay } from '../utils/playEvents';

function normalizeGame(game) {
  const playByPlay = Array.isArray(game.playByPlay) ? game.playByPlay : [];
  const playEvents = playEventsFromPlayByPlay(playByPlay);

  return {
    ...game,
    stats: normalizeGameStats(game.stats),
    playByPlay,
    playEvents,
  };
}

function migrateV1ToV2(state) {
  return {
    ...state,
    schemaVersion: 2,
    games: (state.games || []).map(normalizeGame),
  };
}

/**
 * Upgrade stored state to the current schema and normalize nested data.
 */
export function migrateState(state) {
  if (!state || typeof state !== 'object') return state;

  let next = { ...state };

  if (!next.schemaVersion || next.schemaVersion < 2) {
    next = migrateV1ToV2(next);
  }

  next.schemaVersion = SCHEMA_VERSION;
  next.players = Array.isArray(next.players) ? next.players : [];
  next.games = (next.games || []).map(normalizeGame);
  next.benchmarkSets = Array.isArray(next.benchmarkSets) ? next.benchmarkSets : [];

  return next;
}
