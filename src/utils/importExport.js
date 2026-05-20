import { SCHEMA_VERSION } from '../models/appState';
import { migrateState } from '../storage/migrateState';

export const EXPORT_FORMAT_VERSION = 1;

export function serializeAppState(state) {
  const payload = {
    assistanalyticsExport: true,
    exportVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    schemaVersion: state.schemaVersion ?? SCHEMA_VERSION,
    activePlayerId: state.activePlayerId,
    players: state.players ?? [],
    games: state.games ?? [],
    benchmarkSets: state.benchmarkSets ?? [],
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadJson(filename, jsonString) {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildExportFilename(state) {
  const date = new Date().toISOString().slice(0, 10);
  const count = state.players?.length ?? 0;
  return `assistanalytics-backup-${date}-${count}players.json`;
}

export function validateImportData(raw) {
  const errors = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['File is not a valid JSON object.'], data: null };
  }

  if (!raw.assistanalyticsExport && !raw.players && !raw.games) {
    errors.push('This file does not look like an Assist Analytics backup.');
  }

  if (!Array.isArray(raw.players)) errors.push('Missing or invalid "players" array.');
  if (!Array.isArray(raw.games)) errors.push('Missing or invalid "games" array.');
  if (!Array.isArray(raw.benchmarkSets)) errors.push('Missing or invalid "benchmarkSets" array.');

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  return { valid: true, errors: [], data: raw };
}

export function normalizeImportedState(data) {
  return migrateState({
    schemaVersion: data.schemaVersion ?? 1,
    activePlayerId: data.activePlayerId ?? data.players[0]?.id ?? null,
    players: data.players,
    games: data.games,
    benchmarkSets: data.benchmarkSets,
  });
}

/**
 * Merge imported backup into local state (adds players/games/benchmarks not already present by id).
 */
export function mergeAppStates(local, importedRaw) {
  const imported = normalizeImportedState(importedRaw);
  const playerIds = new Set(local.players.map((p) => p.id));
  const gameIds = new Set(local.games.map((g) => g.id));
  const benchmarkPlayerIds = new Set(local.benchmarkSets.map((b) => b.playerId));

  const newPlayers = imported.players.filter((p) => !playerIds.has(p.id));
  const newGames = imported.games.filter((g) => !gameIds.has(g.id));
  const newBenchmarks = imported.benchmarkSets.filter((b) => !benchmarkPlayerIds.has(b.playerId));

  return migrateState({
    ...local,
    players: [...local.players, ...newPlayers],
    games: [...local.games, ...newGames],
    benchmarkSets: [...local.benchmarkSets, ...newBenchmarks],
    activePlayerId: local.activePlayerId ?? imported.activePlayerId,
  });
}

export function replaceAppState(importedRaw) {
  return normalizeImportedState(importedRaw);
}

export async function readJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}
