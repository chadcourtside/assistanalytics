const QUEUE_STORAGE_KEY = 'assistanalytics-sync-queue';
const MAX_ATTEMPTS = 8;
const BASE_RETRY_MS = 5000;

export function readSyncQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSyncQueue(entry) {
  localStorage.setItem(
    QUEUE_STORAGE_KEY,
    JSON.stringify({
      ...entry,
      queuedAt: entry.queuedAt || new Date().toISOString(),
    })
  );
}

export function clearSyncQueue() {
  localStorage.removeItem(QUEUE_STORAGE_KEY);
}

export function queueCloudSave({ state, expectedUpdatedAt, errorMessage }) {
  const existing = readSyncQueue();
  writeSyncQueue({
    state,
    expectedUpdatedAt: expectedUpdatedAt ?? null,
    attempts: existing?.attempts ?? 0,
    lastError: errorMessage || existing?.lastError || null,
    queuedAt: existing?.queuedAt || new Date().toISOString(),
  });
}

export function shouldRetryQueue(entry) {
  if (!entry) return false;
  if (entry.attempts >= MAX_ATTEMPTS) return false;
  const lastAttempt = entry.lastAttemptAt ? new Date(entry.lastAttemptAt).getTime() : 0;
  const delay = BASE_RETRY_MS * Math.max(1, entry.attempts + 1);
  return Date.now() - lastAttempt >= delay;
}

export function markQueueAttempt(entry, errorMessage) {
  writeSyncQueue({
    ...entry,
    attempts: (entry.attempts ?? 0) + 1,
    lastAttemptAt: new Date().toISOString(),
    lastError: errorMessage || entry.lastError || null,
  });
}

export function isRetryableSyncError(err) {
  if (!err) return true;
  if (err.status === 409) return false;
  if (err.status === 403 || err.status === 401) return false;
  if (err.status === 400) return false;
  return true;
}
