import { createDefaultAppState } from '../data/defaultAppState';
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  LEGACY_GAMES_KEY,
  LEGACY_AVERY_KEY,
} from '../models/appState';
import { migrateLegacyGamesArray } from './migrateLegacyGames';
import { migrateState } from './migrateState';

function repairActivePlayer(state) {
  const { players, activePlayerId } = state;
  if (players.length === 0) {
    return { ...state, activePlayerId: null };
  }
  const exists = players.some((p) => p.id === activePlayerId);
  if (!exists) {
    return { ...state, activePlayerId: players[0].id };
  }
  return state;
}

function parseStoredState(raw) {
  const parsed = JSON.parse(raw);
  if (parsed.schemaVersion && parsed.schemaVersion <= SCHEMA_VERSION) {
    return repairActivePlayer(migrateState(parsed));
  }
  return null;
}

export function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = parseStoredState(stored);
      if (state) return state;
    }

    const legacyGames = localStorage.getItem(LEGACY_GAMES_KEY);
    if (legacyGames) {
      return repairActivePlayer(migrateState(migrateLegacyGamesArray(JSON.parse(legacyGames))));
    }

    const legacyAvery = localStorage.getItem(LEGACY_AVERY_KEY);
    if (legacyAvery) {
      return repairActivePlayer(migrateState(migrateLegacyGamesArray(JSON.parse(legacyAvery))));
    }
  } catch {
    // fall through to default
  }

  return createDefaultAppState();
}
