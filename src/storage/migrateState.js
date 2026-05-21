import { SCHEMA_VERSION } from '../models/appState';
import { normalizeGameStats } from '../utils/gameStats';
import { playEventsFromPlayByPlay } from '../utils/playEvents';
import { normalizeGameType, DEFAULT_APP_META } from '../constants/gameTypes';
import { DEFAULT_BENCHMARK_TARGETS } from '../data/defaultBenchmarkTargets';

import { normalizePlayerFocus, normalizeReviewedClips } from '../utils/playerView';

function normalizeGame(game) {
  const playByPlay = Array.isArray(game.playByPlay) ? game.playByPlay : [];
  const playEvents = playEventsFromPlayByPlay(playByPlay);

  return {
    ...game,
    gameType: normalizeGameType(game.gameType),
    stats: normalizeGameStats(game.stats),
    playByPlay,
    playEvents,
    playerTakeaway: game.playerTakeaway ?? '',
    starredClipIds: Array.isArray(game.starredClipIds) ? game.starredClipIds : [],
  };
}

function normalizePlayer(player) {
  return {
    ...player,
    playerFocus: normalizePlayerFocus(player.playerFocus),
    reviewedClips: normalizeReviewedClips(player.reviewedClips),
  };
}

function mergeBenchmarkTargets(existing) {
  const keys = new Set((existing || []).map((t) => t.metricKey));
  const additions = DEFAULT_BENCHMARK_TARGETS.filter((t) => !keys.has(t.metricKey)).map(
    (t) => ({ ...t })
  );
  return [...(existing || []), ...additions];
}

function migrateV1ToV2(state) {
  return {
    ...state,
    schemaVersion: 2,
    games: (state.games || []).map(normalizeGame),
  };
}

function migrateV2ToV3(state) {
  return {
    ...state,
    schemaVersion: 3,
    meta: {
      ...DEFAULT_APP_META,
      ...(state.meta || {}),
    },
    games: (state.games || []).map((game) => ({
      ...normalizeGame(game),
      gameType: normalizeGameType(game.gameType),
    })),
    benchmarkSets: (state.benchmarkSets || []).map((set) => ({
      ...set,
      targets: mergeBenchmarkTargets(set.targets),
    })),
  };
}

function migrateV3ToV4(state) {
  return {
    ...state,
    schemaVersion: 4,
    players: (state.players || []).map(normalizePlayer),
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

  if (next.schemaVersion < 3) {
    next = migrateV2ToV3(next);
  }

  if (next.schemaVersion < 4) {
    next = migrateV3ToV4(next);
  }

  next.schemaVersion = SCHEMA_VERSION;
  next.meta = { ...DEFAULT_APP_META, ...(next.meta || {}) };
  next.players = (next.players || []).map(normalizePlayer);
  next.games = (next.games || []).map(normalizeGame);
  next.benchmarkSets = Array.isArray(next.benchmarkSets) ? next.benchmarkSets : [];

  return next;
}
