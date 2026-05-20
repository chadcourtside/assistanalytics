import { useState, useEffect, useMemo, useCallback } from 'react';
import { loadState } from '../storage/loadState';
import { saveState } from '../storage/saveState';
import { createBenchmarkSet } from '../data/defaultBenchmarkTargets';
import { createPlayerId, createBenchmarkId, nowIso } from '../models/appState';

export function useAppState() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activePlayer = useMemo(
    () => state.players.find((p) => p.id === state.activePlayerId) ?? null,
    [state.players, state.activePlayerId]
  );

  const activePlayerGames = useMemo(
    () =>
      state.activePlayerId
        ? state.games.filter((g) => g.playerId === state.activePlayerId)
        : [],
    [state.games, state.activePlayerId]
  );

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

  const updateGameUrl = useCallback(
    (gameId, url) => {
      if (!state.activePlayerId) return;
      const ts = nowIso();
      setState((prev) => ({
        ...prev,
        games: prev.games.map((g) =>
          g.id === gameId && g.playerId === prev.activePlayerId
            ? { ...g, videoUrl: url, updatedAt: ts }
            : g
        ),
      }));
    },
    [state.activePlayerId]
  );

  return {
    state,
    activePlayer,
    activePlayerGames,
    activeBenchmarkSet,
    setActivePlayerId,
    addPlayer,
    updateGameUrl,
  };
}
