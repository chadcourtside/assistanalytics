export {
  buildPlayerPortalPayload,
  toBoxScoreGame,
  toPlayerGame,
} from '../../shared/playerPortalCore.js';

export function buildPlayerPortalUrl(token) {
  if (!token || typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  url.searchParams.set('playerToken', token);
  url.searchParams.delete('join');
  url.searchParams.delete('role');
  return url.toString();
}

export const PLAYER_PORTAL_TOKEN_KEY = 'assistanalytics-player-token';

export function readStoredPlayerToken() {
  try {
    return sessionStorage.getItem(PLAYER_PORTAL_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function writeStoredPlayerToken(token) {
  try {
    if (token) sessionStorage.setItem(PLAYER_PORTAL_TOKEN_KEY, token);
    else sessionStorage.removeItem(PLAYER_PORTAL_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

export function readPlayerTokenFromUrl() {
  if (typeof window === 'undefined') return '';
  return (new URLSearchParams(window.location.search).get('playerToken') || '').trim();
}

export function clearPlayerTokenFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('playerToken')) return;
  url.searchParams.delete('playerToken');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}
