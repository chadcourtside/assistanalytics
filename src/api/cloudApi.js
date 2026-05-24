const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
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

export async function fetchSession() {
  return apiFetch('/auth/me');
}

export async function signup({ email, password, teamName }) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, teamName }),
  });
}

export async function login({ email, password }) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export async function createTeam({ name }) {
  return apiFetch('/teams/create', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function joinTeam({ inviteCode, role }) {
  return apiFetch('/teams/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode, role }),
  });
}

export async function fetchTeamMembers() {
  return apiFetch('/teams/members');
}

export async function updateMemberRole({ userId, role }) {
  return apiFetch('/teams/members', {
    method: 'PATCH',
    body: JSON.stringify({ userId, role }),
  });
}

export async function removeTeamMember({ userId }) {
  return apiFetch('/teams/members', {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
  });
}

export async function fetchCloudState() {
  return apiFetch('/state');
}

export async function saveCloudState(state, expectedUpdatedAt) {
  const headers = {};
  if (expectedUpdatedAt) {
    headers['If-Match'] = expectedUpdatedAt;
  }

  return apiFetch('/state', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ state, expectedUpdatedAt }),
  });
}

export async function resetPassword({ token, password }) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function requestMagicLink({ email }) {
  return apiFetch('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function requestPasswordReset({ email }) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function consumeAuthToken({ token }) {
  return apiFetch('/auth/consume', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function requestNarrationSuggestions({ transcript, playerName }) {
  return apiFetch('/ai/narration-to-pbp', {
    method: 'POST',
    body: JSON.stringify({ transcript, playerName }),
  });
}

export async function isCloudApiAvailable() {
  try {
    await fetchSession();
    return true;
  } catch (err) {
    if (err.status === 503) return false;
    return true;
  }
}
