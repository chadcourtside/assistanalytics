export const DEBUG_VIEW_STORAGE_KEY = 'assistanalytics-debug-view';

export const DEBUG_VIEW_MODES = [
  { id: 'actual', label: 'Actual session', description: 'Your real role and permissions' },
  { id: 'owner', label: 'Owner', description: 'Full access plus team settings' },
  { id: 'coach', label: 'Coach', description: 'Full edit access, no owner-only settings' },
  { id: 'viewer', label: 'Parent / Viewer', description: 'Read-only team access' },
  { id: 'local', label: 'Local only', description: 'Offline mode without cloud sync UI' },
  { id: 'player', label: 'Player portal', description: 'Athlete view for the selected player' },
  { id: 'unauthed', label: 'Login screen', description: 'Signed-out auth gate' },
  { id: 'needs_team', label: 'Needs team', description: 'Signed in but no team selected' },
];

const DEFAULT_ADMIN_EMAILS = ['chad.courtside@gmail.com'];

export function getDebugAdminEmails() {
  const fromEnv = import.meta.env.VITE_DEBUG_ADMIN_EMAILS;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

export function isDebugAdmin(user) {
  const email = (user?.email || '').trim().toLowerCase();
  if (!email) return false;
  return getDebugAdminEmails().includes(email);
}

export function readStoredDebugView() {
  try {
    const value = sessionStorage.getItem(DEBUG_VIEW_STORAGE_KEY) || 'actual';
    return DEBUG_VIEW_MODES.some((mode) => mode.id === value) ? value : 'actual';
  } catch {
    return 'actual';
  }
}

export function writeStoredDebugView(view) {
  try {
    if (!view || view === 'actual') {
      sessionStorage.removeItem(DEBUG_VIEW_STORAGE_KEY);
    } else {
      sessionStorage.setItem(DEBUG_VIEW_STORAGE_KEY, view);
    }
  } catch {
    // ignore storage errors
  }
}

/** Apply a UI-only debug override on top of the real auth session. */
export function applyDebugView(auth, debugView) {
  if (!debugView || debugView === 'actual') {
    return auth;
  }

  const user = auth?.user ?? null;
  const team = auth?.team ?? null;

  switch (debugView) {
    case 'owner':
      if (auth?.status !== 'authed' || !team) return auth;
      return {
        ...auth,
        team: { ...team, role: 'owner' },
        debugPreview: debugView,
      };
    case 'coach':
      if (auth?.status !== 'authed' || !team) return auth;
      return {
        ...auth,
        team: { ...team, role: 'coach' },
        debugPreview: debugView,
      };
    case 'viewer':
      if (auth?.status !== 'authed' || !team) return auth;
      return {
        ...auth,
        team: { ...team, role: 'viewer' },
        debugPreview: debugView,
      };
    case 'local':
      return {
        ...auth,
        status: 'local',
        user: null,
        team: null,
        debugPreview: debugView,
      };
    case 'unauthed':
      return {
        status: 'unauthed',
        user: null,
        team: null,
        error: null,
        debugPreview: debugView,
      };
    case 'needs_team':
      return {
        status: 'needs_team',
        user,
        team: null,
        error: null,
        debugPreview: debugView,
      };
    case 'player':
      return {
        ...auth,
        debugPreview: debugView,
      };
    default:
      return auth;
  }
}

export function getDebugViewLabel(debugView) {
  return DEBUG_VIEW_MODES.find((mode) => mode.id === debugView)?.label ?? debugView;
}

export function isDebugPreviewActive(debugView) {
  return Boolean(debugView && debugView !== 'actual');
}
