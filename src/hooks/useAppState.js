import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadState } from '../storage/loadState';
import { saveState } from '../storage/saveState';
import { createBenchmarkSet } from '../data/defaultBenchmarkTargets';
import { sortGamesNewestFirst } from '../utils/gameStats';
import { playEventsFromPlayByPlay } from '../utils/playEvents';
import {
  mergeAppStates,
  replaceAppState,
  validateImportData,
} from '../utils/importExport';
import { createPlayerId, createBenchmarkId, createGameId, nowIso } from '../models/appState';

function enrichGamePayload(payload) {
  const playByPlay = payload.playByPlay ?? [];
  return {
    ...payload,
    playByPlay,
    playEvents: payload.playEvents ?? playEventsFromPlayByPlay(playByPlay),
  };
}

export function useAppState() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
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
      return { ...prev, games: [...prev.games, game] };
    });
  }, []);

  const updateGame = useCallback((gameId, payload) => {
    setState((prev) => {
      if (!prev.activePlayerId) return prev;
      const ts = nowIso();
      return {
        ...prev,
        games: prev.games.map((g) =>
          g.id === gameId && g.playerId === prev.activePlayerId
            ? { ...g, ...enrichGamePayload(payload), updatedAt: ts }
            : g
        ),
      };
    });
  }, []);

  const deleteGame = useCallback((gameId) => {
    setState((prev) => ({
      ...prev,
      games: prev.games.filter(
        (g) => !(g.id === gameId && g.playerId === prev.activePlayerId)
      ),
    }));
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

  const importAppState = useCallback((raw, mode) => {
    const { valid, errors, data } = validateImportData(raw);
    if (!valid) {
      return { success: false, errors };
    }

    setState((prev) => {
      const next =
        mode === 'merge' ? mergeAppStates(prev, data) : replaceAppState(data);
      return next;
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
    importAppState,
  };
}
