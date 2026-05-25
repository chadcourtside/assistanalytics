export const GAME_TYPES = {
  GAME: 'game',
};

export const DEFAULT_APP_META = {
  lastExportAt: null,
  autoBackupOnSave: false,
  exportReminderDays: 7,
  backupSnoozedUntil: null,
  currentSeason: '',
  archivedSeasons: [],
};

/** All logged sessions are tracked as games; legacy types normalize on read. */
export function normalizeGameType() {
  return GAME_TYPES.GAME;
}
