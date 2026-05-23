import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import {
  isLocalOnlyMode,
  loadLocalState,
  saveLocalState,
  readCloudSyncMeta,
  writeCloudSyncMeta,
} from '../storage/storageAdapter';
import { cloudPayloadToState, stateToCloudPayload } from '../utils/cloudState';
import { fetchCloudState, saveCloudState } from '../api/cloudApi';
import { useAuth } from './useAuth';

const CLOUD_SAVE_DELAY_MS = 1500;

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
  const {
    auth,
    refreshSession,
    signup,
    login,
    logout,
    createTeam,
    joinTeam,
    useLocalMode,
  } = useAuth();

  const [state, setState] = useState(loadLocalState);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState(null);
  const [conflictInfo, setConflictInfo] = useState(null);

  const cloudUpdatedAtRef = useRef(readCloudSyncMeta().updatedAt);
  const skipCloudSaveRef = useRef(true);
  const saveTimerRef = useRef(null);
  const stateRef = useRef(state);
  const isInitialMount = useRef(true);
  const hydrationDoneRef = useRef(false);

  stateRef.current = state;

  const pushCloudState = useCallback(async (nextState, { force = false } = {}) => {
    if (auth.status !== 'authed') return;

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const result = await saveCloudState(
        stateToCloudPayload(nextState),
        force ? null : cloudUpdatedAtRef.current
      );
      cloudUpdatedAtRef.current = result.updatedAt;
      writeCloudSyncMeta({ updatedAt: result.updatedAt });
      setSyncStatus('saved');
      setConflictInfo(null);
    } catch (err) {
      if (err.status === 409 && err.body?.state) {
        setSyncStatus('conflict');
        setConflictInfo({
          updatedAt: err.body.updatedAt,
          state: cloudPayloadToState(err.body.state),
        });
        setSyncError('Cloud data was updated on another device.');
        return;
      }

      setSyncStatus('error');
      setSyncError(err.body?.error || err.message || 'Cloud sync failed');
    }
  }, [auth.status]);

  const scheduleCloudSave = useCallback(
    (nextState) => {
      if (auth.status !== 'authed') return;
      if (skipCloudSaveRef.current) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        pushCloudState(nextState);
      }, CLOUD_SAVE_DELAY_MS);
    },
    [auth.status, pushCloudState]
  );

  const hydrateFromCloud = useCallback(async () => {
    try {
      const { state: cloudState, updatedAt } = await fetchCloudState();
      cloudUpdatedAtRef.current = updatedAt;
      writeCloudSyncMeta({ updatedAt });

      if (cloudState) {
        const migrated = cloudPayloadToState(cloudState);
        if (migrated) {
          skipCloudSaveRef.current = true;
          setState(migrated);
          saveLocalState(migrated);
        }
      } else {
        const local = stateRef.current;
        skipCloudSaveRef.current = true;
        await pushCloudState(local, { force: true });
      }

      setSyncStatus('saved');
    } catch (err) {
      setSyncStatus('offline');
      setSyncError('Using offline cache — cloud sync unavailable.');
    } finally {
      hydrationDoneRef.current = true;
      setTimeout(() => {
        skipCloudSaveRef.current = false;
      }, 0);
    }
  }, [pushCloudState]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (isLocalOnlyMode()) {
        if (!cancelled) {
          useLocalMode();
          hydrationDoneRef.current = true;
          skipCloudSaveRef.current = false;
        }
        return;
      }

      const session = await refreshSession();
      if (cancelled) return;

      if (!session?.team) {
        hydrationDoneRef.current = true;
        skipCloudSaveRef.current = false;
      }
    }

    init();

    return () => {
      cancelled = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [refreshSession, useLocalMode]);

  useEffect(() => {
    if (auth.status !== 'authed' || !auth.team?.id) return;

    let cancelled = false;

    async function syncFromCloud() {
      await hydrateFromCloud();
      if (cancelled && saveTimerRef.current) clearTimeout(saveTimerRef.current);
    }

    syncFromCloud();

    return () => {
      cancelled = true;
    };
  }, [auth.status, auth.team?.id, hydrateFromCloud]);

  useEffect(() => {
    saveLocalState(state);
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    scheduleCloudSave(state);
  }, [state, scheduleCloudSave]);

  const acceptCloudConflict = useCallback(() => {
    if (!conflictInfo?.state) return;
    skipCloudSaveRef.current = true;
    setState(conflictInfo.state);
    saveLocalState(conflictInfo.state);
    cloudUpdatedAtRef.current = conflictInfo.updatedAt;
    writeCloudSyncMeta({ updatedAt: conflictInfo.updatedAt });
    setConflictInfo(null);
    setSyncStatus('saved');
    setSyncError(null);
    setTimeout(() => {
      skipCloudSaveRef.current = false;
    }, 0);
  }, [conflictInfo]);

  const retryCloudSync = useCallback(() => {
    pushCloudState(stateRef.current, { force: false });
  }, [pushCloudState]);

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
    return state.benchmarkSets.find((b) => b.playerId === state.activePlayerId) ?? null;
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
    const displayName = trimmedLast ? `${trimmedFirst} ${trimmedLast}` : trimmedFirst;

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
      const displayName = trimmedLast ? `${firstName} ${trimmedLast}` : firstName;

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
    auth,
    syncStatus,
    syncError,
    conflictInfo,
    signup,
    login,
    logout,
    createTeam,
    joinTeam,
    useLocalMode,
    acceptCloudConflict,
    retryCloudSync,
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
