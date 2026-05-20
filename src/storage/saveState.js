import { STORAGE_KEY } from '../models/appState';

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
