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
import {
  clearSyncQueue,
  isRetryableSyncError,
  markQueueAttempt,
  queueCloudSave,
  readSyncQueue,
  shouldRetryQueue,
} from '../storage/syncQueue';
import { cloudPayloadToState, stateToCloudPayload } from '../utils/cloudState';
import { fetchCloudState, saveCloudState } from '../api/cloudApi';
import { useAuth } from './useAuth';
import { canEditTeamData } from '../utils/accessControl';
import { normalizeTeamList } from '../utils/playerTeams';

const CLOUD_SAVE_DELAY_MS = 1500;
const SESSION_REFRESH_MS = 30_000;

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
  const [syncStatus, setSyncStatus] = useState(() => (readSyncQueue() ? 'pending' : 'idle'));
  const [syncError, setSyncError] = useState(null);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [hasPendingSync, setHasPendingSync] = useState(() => Boolean(readSyncQueue()));

  const cloudUpdatedAtRef = useRef(readCloudSyncMeta().updatedAt);
  const skipCloudSaveRef = useRef(true);
  const saveTimerRef = useRef(null);
  const stateRef = useRef(state);
  const isInitialMount = useRef(true);
  const hydrationDoneRef = useRef(false);

  stateRef.current = state;

  const canEdit = useMemo(() => canEditTeamData(auth), [auth]);

  const pushCloudState = useCallback(async (nextState, { force = false } = {}) => {
    if (auth.status !== 'authed') return false;
    if (!canEditTeamData(auth)) return false;

    setSyncStatus('syncing');
    setSyncError(null);

    const payload = stateToCloudPayload(nextState);

    try {
      const result = await saveCloudState(payload, force ? null : cloudUpdatedAtRef.current);
      cloudUpdatedAtRef.current = result.updatedAt;
      writeCloudSyncMeta({ updatedAt: result.updatedAt });
      clearSyncQueue();
      setHasPendingSync(false);
      setSyncStatus('saved');
      setConflictInfo(null);
      return true;
    } catch (err) {
      if (err.status === 409 && err.body?.state) {
        setSyncStatus('conflict');
        setConflictInfo({
          updatedAt: err.body.updatedAt,
          state: cloudPayloadToState(err.body.state),
        });
        setSyncError('Cloud data was updated on another device.');
        return false;
      }

      const message = err.body?.error || err.message || 'Cloud sync failed';
      if (isRetryableSyncError(err)) {
        queueCloudSave({
          state: payload,
          expectedUpdatedAt: force ? null : cloudUpdatedAtRef.current,
          errorMessage: message,
        });
        setHasPendingSync(true);
        setSyncStatus('pending');
        setSyncError('Offline — changes saved locally and will retry automatically.');
      } else {
        setSyncStatus('error');
        setSyncError(message);
      }
      return false;
    }
  }, [auth]);

  const flushPendingSync = useCallback(async () => {
    if (auth.status !== 'authed' || !canEditTeamData(auth)) return;

    const entry = readSyncQueue();
    if (!entry?.state) {
      setHasPendingSync(false);
      return;
    }

    if (!shouldRetryQueue(entry)) {
      if ((entry.attempts ?? 0) >= 8) {
        setSyncStatus('error');
        setSyncError(entry.lastError || 'Could not sync after multiple attempts.');
      }
      return;
    }

    setSyncStatus('syncing');
    markQueueAttempt(entry, entry.lastError);

    try {
      const result = await saveCloudState(entry.state, entry.expectedUpdatedAt);
      cloudUpdatedAtRef.current = result.updatedAt;
      writeCloudSyncMeta({ updatedAt: result.updatedAt });
      clearSyncQueue();
      setHasPendingSync(false);
      setSyncStatus('saved');
      setSyncError(null);
      setConflictInfo(null);
    } catch (err) {
      if (err.status === 409 && err.body?.state) {
        clearSyncQueue();
        setHasPendingSync(false);
        setSyncStatus('conflict');
        setConflictInfo({
          updatedAt: err.body.updatedAt,
          state: cloudPayloadToState(err.body.state),
        });
        setSyncError('Cloud data was updated on another device.');
        return;
      }

      const message = err.body?.error || err.message || 'Cloud sync failed';
      if (isRetryableSyncError(err)) {
        queueCloudSave({
          state: entry.state,
          expectedUpdatedAt: entry.expectedUpdatedAt,
          errorMessage: message,
        });
        setHasPendingSync(true);
        setSyncStatus('pending');
        setSyncError('Offline — changes saved locally and will retry automatically.');
      } else {
        clearSyncQueue();
        setHasPendingSync(false);
        setSyncStatus('error');
        setSyncError(message);
      }
    }
  }, [auth]);

  const scheduleCloudSave = useCallback(
    (nextState) => {
      if (auth.status !== 'authed' || !canEditTeamData(auth)) return;
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
    if (auth.status !== 'authed') return undefined;

    const onOnline = () => {
      flushPendingSync();
    };
    const onFocus = () => {
      refreshSession();
      flushPendingSync();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    const interval = setInterval(() => {
      refreshSession();
      flushPendingSync();
    }, SESSION_REFRESH_MS);

    flushPendingSync();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [auth.status, flushPendingSync, refreshSession]);

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
    const entry = readSyncQueue();
    if (entry?.state) {
      flushPendingSync();
      return;
    }
    pushCloudState(stateRef.current, { force: false });
  }, [pushCloudState, flushPendingSync]);

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

  const addPlayer = useCallback(({ firstName, lastName, jerseyNumber, teams, position, season }) => {
    if (!canEditTeamData(auth)) return null;
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
      teams: normalizeTeamList(teams),
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
  }, [auth]);

  const addGame = useCallback((payload) => {
    if (!canEditTeamData(auth)) return;
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
  }, [auth]);

  const updateGame = useCallback((gameId, payload) => {
    if (!canEditTeamData(auth)) return;
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
  }, [auth]);

  const deleteGame = useCallback((gameId) => {
    if (!canEditTeamData(auth)) return;
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
  }, [auth]);

  const updateGameUrl = useCallback((gameId, url) => {
    updateGame(gameId, { videoUrl: url });
  }, [updateGame]);

  const updateBenchmarkTargets = useCallback((playerId, targets) => {
    if (!canEditTeamData(auth)) return;
    setState((prev) => ({
      ...prev,
      benchmarkSets: prev.benchmarkSets.map((b) =>
        b.playerId === playerId ? { ...b, targets } : b
      ),
    }));
  }, [auth]);

  const updatePlayer = useCallback((playerId, updates) => {
    if (!canEditTeamData(auth)) return;
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
                ...(updates.teams != null
                  ? { teams: normalizeTeamList(updates.teams) }
                  : {}),
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
  }, [auth]);

  const updatePlayerFocus = useCallback((playerId, playerFocus) => {
    if (!canEditTeamData(auth)) return;
    setState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === playerId ? { ...p, playerFocus, updatedAt: nowIso() } : p
      ),
    }));
  }, [auth]);

  const markClipReviewed = useCallback((playerId, clipId, note) => {
    if (!canEditTeamData(auth)) return;
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
  }, [auth]);

  const toggleStarredClip = useCallback((gameId, clipId) => {
    if (!canEditTeamData(auth)) return;
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
  }, [auth]);

  const importAppState = useCallback((raw, mode) => {
    if (!canEditTeamData(auth)) {
      return { success: false, errors: ['View-only members cannot import data.'] };
    }
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
  }, [auth]);

  return {
    state,
    activePlayer,
    activePlayerGames,
    activeBenchmarkSet,
    auth,
    canEdit,
    syncStatus,
    syncError,
    conflictInfo,
    hasPendingSync,
    refreshSession,
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
