export function readAuthTokenFromUrl() {
  if (typeof window === 'undefined') return '';
  return (new URLSearchParams(window.location.search).get('authToken') || '').trim();
}

export function readResetTokenFromUrl() {
  if (typeof window === 'undefined') return '';
  return (new URLSearchParams(window.location.search).get('resetToken') || '').trim();
}

export function clearAuthParamsFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of ['authToken', 'resetToken']) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }
}
