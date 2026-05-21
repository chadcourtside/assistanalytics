import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { loadState } from '../storage/loadState';
import { saveState } from '../storage/saveState';
import { createBenchmarkSet } from '../data/defaultBenchmarkTargets';
import { sortGamesNewestFirst } from '../utils/gameStats';
import { playEventsFromPlayByPlay } from '../utils/playEvents';
import {
  mergeAppStates,
  replaceAppState,
  validateImportData,
  exportAppStateToFile,
} from '../utils/importExport';
import { createPlayerId, createBenchmarkId, createGameId, nowIso } from '../models/appState';
import { normalizeGameType, DEFAULT_APP_META } from '../constants/gameTypes';

function enrichGamePayload(payload) {
  const playByPlay = payload.playByPlay ?? [];
  return {
    ...payload,
    playByPlay,
    playEvents: payload.playEvents ?? playEventsFromPlayByPlay(playByPlay),
    gameType: normalizeGameType(payload.gameType),
  };
}

function maybeAutoBackup(state) {
  if (!state.meta?.autoBackupOnSave) return;
  exportAppStateToFile(state);
}

export function useAppState() {
  const [state, setState] = useState(loadState);
  const isInitialMount = useRef(true);

  useEffect(() => {
    saveState(state);
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
  }, [state]);

  const activePlayer = useMemo(
    () => state.players.find((p) => p.id === state.activePlayerId) ?? null,
    [state.players, state.activePlayerId]
  );

  const activePlayerGames = useMemo(() => {
    if (!state.activePlayerId) return [];
    const filtered = state.games.filter((g) => g.playerId === state.activePlayerId);
    return sortGamesNewestFirst(filtered);
  }, [state.games, state.activePlayerId]);

  const activeBenchmarkSet = useMemo(() => {
    if (!state.activePlayerId) return null;
    return (
      state.benchmarkSets.find((b) => b.playerId === state.activePlayerId) ?? null
    );
  }, [state.benchmarkSets, state.activePlayerId]);

  const setActivePlayerId = useCallback((playerId) => {
    setState((prev) => ({ ...prev, activePlayerId: playerId }));
  }, []);

  const updateMeta = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      meta: { ...DEFAULT_APP_META, ...prev.meta, ...patch },
    }));
  }, []);

  const recordExport = useCallback(() => {
    setState((prev) => {
      const next = {
        ...prev,
        meta: {
          ...DEFAULT_APP_META,
          ...prev.meta,
          lastExportAt: nowIso(),
          backupSnoozedUntil: null,
        },
      };
      exportAppStateToFile(next);
      return next;
    });
  }, []);

  const snoozeBackupReminder = useCallback(() => {
    const snoozeUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    updateMeta({ backupSnoozedUntil: snoozeUntil });
  }, [updateMeta]);

  const addPlayer = useCallback(({ firstName, lastName, jerseyNumber, team, position, season }) => {
    const ts = nowIso();
    const trimmedFirst = (firstName || '').trim();
    if (!trimmedFirst) return null;

    const trimmedLast = (lastName || '').trim();
    const displayName = trimmedLast
      ? `${trimmedFirst} ${trimmedLast}`
      : trimmedFirst;

    const id = createPlayerId();
    const player = {
      id,
      firstName: trimmedFirst,
      lastName: trimmedLast || undefined,
      displayName,
      jerseyNumber: jerseyNumber?.trim() || undefined,
      team: team?.trim() || undefined,
      position: position?.trim() || undefined,
      season: season?.trim() || undefined,
      playerFocus: { weeklySummary: '', pinnedMetricKeys: [] },
      reviewedClips: {},
      createdAt: ts,
      updatedAt: ts,
    };

    const benchmarkSet = createBenchmarkSet(id, createBenchmarkId(id));

    setState((prev) => ({
      ...prev,
      players: [...prev.players, player],
      benchmarkSets: [...prev.benchmarkSets, benchmarkSet],
      activePlayerId: id,
    }));

    return player;
  }, []);

  const addGame = useCallback((payload) => {
    setState((prev) => {
      if (!prev.activePlayerId) return prev;
      const ts = nowIso();
      const game = {
        id: createGameId(),
        playerId: prev.activePlayerId,
        ...enrichGamePayload(payload),
        createdAt: ts,
        updatedAt: ts,
      };
      const next = { ...prev, games: [...prev.games, game] };
      maybeAutoBackup(next);
      return next;
    });
  }, []);

  const updateGame = useCallback((gameId, payload) => {
    setState((prev) => {
      if (!prev.activePlayerId) return prev;
      const ts = nowIso();
      const next = {
        ...prev,
        games: prev.games.map((g) =>
          g.id === gameId && g.playerId === prev.activePlayerId
            ? { ...g, ...enrichGamePayload(payload), updatedAt: ts }
            : g
        ),
      };
      maybeAutoBackup(next);
      return next;
    });
  }, []);

  const deleteGame = useCallback((gameId) => {
    setState((prev) => {
      const next = {
        ...prev,
        games: prev.games.filter(
          (g) => !(g.id === gameId && g.playerId === prev.activePlayerId)
        ),
      };
      maybeAutoBackup(next);
      return next;
    });
  }, []);

  const updateGameUrl = useCallback((gameId, url) => {
    updateGame(gameId, { videoUrl: url });
  }, [updateGame]);

  const updateBenchmarkTargets = useCallback((playerId, targets) => {
    setState((prev) => ({
      ...prev,
      benchmarkSets: prev.benchmarkSets.map((b) =>
        b.playerId === playerId ? { ...b, targets } : b
      ),
    }));
  }, []);

  const updatePlayer = useCallback((playerId, updates) => {
    setState((prev) => {
      const trimmedFirst = (updates.firstName || '').trim();
      const existing = prev.players.find((p) => p.id === playerId);
      if (!existing) return prev;

      const trimmedLast = (updates.lastName || '').trim();
      const firstName = trimmedFirst || existing.firstName;
      const displayName = trimmedLast
        ? `${firstName} ${trimmedLast}`
        : firstName;

      return {
        ...prev,
        players: prev.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                ...(updates.firstName != null
                  ? {
                      firstName,
                      lastName: trimmedLast || undefined,
                      displayName,
                    }
                  : {}),
                ...(updates.jerseyNumber != null
                  ? { jerseyNumber: updates.jerseyNumber?.trim() || undefined }
                  : {}),
                ...(updates.team != null ? { team: updates.team?.trim() || undefined } : {}),
                ...(updates.position != null
                  ? { position: updates.position?.trim() || undefined }
                  : {}),
                ...(updates.season != null
                  ? { season: updates.season?.trim() || p.season }
                  : {}),
                ...(updates.playerFocus != null ? { playerFocus: updates.playerFocus } : {}),
                updatedAt: nowIso(),
              }
            : p
        ),
      };
    });
  }, []);

  const updatePlayerFocus = useCallback((playerId, playerFocus) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, playerFocus, updatedAt: nowIso() } : p
      ),
    }));
  }, []);

  const markClipReviewed = useCallback((playerId, clipId, note) => {
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          reviewedClips: {
            ...(p.reviewedClips ?? {}),
            [clipId]: { at: nowIso(), note: note?.trim() || undefined },
          },
          updatedAt: nowIso(),
        };
      }),
    }));
  }, []);

  const toggleStarredClip = useCallback((gameId, clipId) => {
    setState((prev) => {
      const next = {
        ...prev,
        games: prev.games.map((g) => {
          if (g.id !== gameId) return g;
          const ids = new Set(g.starredClipIds ?? []);
          if (ids.has(clipId)) ids.delete(clipId);
          else ids.add(clipId);
          return { ...g, starredClipIds: [...ids], updatedAt: nowIso() };
        }),
      };
      maybeAutoBackup(next);
      return next;
    });
  }, []);

  const importAppState = useCallback((raw, mode) => {
    const { valid, errors, data } = validateImportData(raw);
    if (!valid) {
      return { success: false, errors };
    }

    setState((prev) => {
      const next =
        mode === 'merge' ? mergeAppStates(prev, data) : replaceAppState(data);
      return {
        ...next,
        meta: {
          ...DEFAULT_APP_META,
          ...next.meta,
          lastExportAt: nowIso(),
        },
      };
    });

    return { success: true, errors: [] };
  }, []);

  return {
    state,
    activePlayer,
    activePlayerGames,
    activeBenchmarkSet,
    setActivePlayerId,
    addPlayer,
    addGame,
    updateGame,
    deleteGame,
    updateGameUrl,
    updateBenchmarkTargets,
    updatePlayer,
    updatePlayerFocus,
    markClipReviewed,
    toggleStarredClip,
    importAppState,
    recordExport,
    updateMeta,
    snoozeBackupReminder,
  };
}
