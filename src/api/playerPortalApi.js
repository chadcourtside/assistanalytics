const API_BASE = '/api';

async function playerApiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: options.credentials ?? 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const error = new Error(body?.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

export async function fetchPlayerPortal(token) {
  const query = new URLSearchParams({ token: token.trim() });
  return playerApiFetch(`/player/portal?${query.toString()}`, { credentials: 'omit' });
}

export async function fetchPlayerLink(playerId) {
  const query = new URLSearchParams({ playerId });
  return playerApiFetch(`/players/link?${query.toString()}`);
}

export async function createPlayerLink(playerId) {
  return playerApiFetch('/players/link', {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });
}

export async function revokePlayerLink(playerId) {
  return playerApiFetch('/players/link', {
    method: 'DELETE',
    body: JSON.stringify({ playerId }),
  });
}
