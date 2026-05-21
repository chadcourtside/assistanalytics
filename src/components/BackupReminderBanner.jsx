import { daysSinceIso } from '../utils/importExport';

export default function BackupReminderBanner({ meta, onExport, onDismiss }) {
  const days = daysSinceIso(meta?.lastExportAt);
  const reminderDays = meta?.exportReminderDays ?? 7;

  if (days !== null && days < reminderDays) return null;

  if (meta?.backupSnoozedUntil) {
    const snoozed = new Date(meta.backupSnoozedUntil).getTime();
    if (!Number.isNaN(snoozed) && snoozed > Date.now()) return null;
  }

  const message =
    days === null
      ? 'No backup yet this season — export your data so you do not lose it if you switch devices.'
      : `Last backup was ${days} day${days === 1 ? '' : 's'} ago — export to keep your season safe.`;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2.5 no-print">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
        <p className="font-medium">{message}</p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onExport}
            className="bg-amber-950 hover:bg-black text-amber-50 px-3 py-1.5 rounded-md font-semibold text-xs"
          >
            Export now
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-amber-950/80 hover:text-amber-950 font-semibold text-xs px-2"
            >
              Remind me later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
