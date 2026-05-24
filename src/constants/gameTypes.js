export const GAME_TYPES = {
  GAME: 'game',
  SCRIMMAGE: 'scrimmage',
  PRACTICE: 'practice',
};

export const GAME_TYPE_OPTIONS = [
  { value: GAME_TYPES.GAME, label: 'Game' },
  { value: GAME_TYPES.SCRIMMAGE, label: 'Scrimmage' },
  { value: GAME_TYPES.PRACTICE, label: 'Practice' },
];

export const GAME_TYPE_LABELS = Object.fromEntries(
  GAME_TYPE_OPTIONS.map(({ value, label }) => [value, label])
);

export const DEFAULT_APP_META = {
  lastExportAt: null,
  autoBackupOnSave: false,
  exportReminderDays: 7,
  backupSnoozedUntil: null,
  currentSeason: '',
  archivedSeasons: [],
};

export function normalizeGameType(value) {
  const v = (value || '').trim().toLowerCase();
  if (v === GAME_TYPES.SCRIMMAGE || v === GAME_TYPES.PRACTICE) return v;
  return GAME_TYPES.GAME;
}
