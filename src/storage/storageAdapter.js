import { loadState } from './loadState';
import { saveState } from './saveState';

export const LOCAL_ONLY_KEY = 'assistanalytics-local-only';
export const CLOUD_SYNC_META_KEY = 'assistanalytics-cloud-sync-meta';

export function isLocalOnlyMode() {
  return localStorage.getItem(LOCAL_ONLY_KEY) === '1';
}

export function setLocalOnlyMode(enabled) {
  if (enabled) {
    localStorage.setItem(LOCAL_ONLY_KEY, '1');
  } else {
    localStorage.removeItem(LOCAL_ONLY_KEY);
  }
}

export function loadLocalState() {
  return loadState();
}

export function saveLocalState(state) {
  saveState(state);
}

export function readCloudSyncMeta() {
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_META_KEY);
    return raw ? JSON.parse(raw) : { updatedAt: null };
  } catch {
    return { updatedAt: null };
  }
}

export function writeCloudSyncMeta(meta) {
  localStorage.setItem(CLOUD_SYNC_META_KEY, JSON.stringify(meta));
}
