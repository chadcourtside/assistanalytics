import { useState, useEffect } from 'react';
import { DEFAULT_GAMES } from '../data/defaultGames';

const STORAGE_KEY = 'assistanalytics-games';
const LEGACY_STORAGE_KEY = 'averyGames';

function loadGames() {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      return JSON.parse(legacy);
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_GAMES;
}

export function useGames() {
  const [games, setGames] = useState(loadGames);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  }, [games]);

  const updateGameUrl = (gameId, url) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, videoUrl: url } : g))
    );
  };

  return { games, updateGameUrl };
}
