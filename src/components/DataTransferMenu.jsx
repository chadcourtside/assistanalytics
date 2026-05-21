import { useRef, useState } from 'react';
import {
  buildExportFilename,
  readJsonFile,
  validateImportData,
} from '../utils/importExport';

export default function DataTransferMenu({ meta, onExport, onImport, onUpdateMeta }) {
  const fileRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleExport = () => {
    onExport?.();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    try {
      const raw = await readJsonFile(file);
      const { valid, errors, data } = validateImportData(raw);
      if (!valid) {
        setImportError(errors.join(' '));
        return;
      }
      setPendingImport(data);
    } catch {
      setImportError('Could not read that file. Make sure it is a valid JSON backup.');
    }
  };

  const confirmImport = (mode) => {
    if (!pendingImport) return;
    const result = onImport(pendingImport, mode);
    setPendingImport(null);
    if (result.success) {
      setImportSuccess(
        mode === 'merge'
          ? 'Backup merged — new players and games were added.'
          : 'Backup restored — your data was replaced with the import.'
      );
    } else {
      setImportError(result.errors?.join(' ') || 'Import failed.');
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 relative">
        <button
          type="button"
          onClick={handleExport}
          className="text-sm border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-md font-semibold whitespace-nowrap"
          title="Download a JSON backup for another device"
        >
          Export
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-sm border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-md font-semibold whitespace-nowrap"
          title="Import a JSON backup from another device"
        >
          Import
        </button>
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="text-sm border border-slate-600 text-slate-200 hover:bg-slate-800 px-2 py-2 rounded-md font-semibold"
          title="Backup settings"
          aria-label="Backup settings"
        >
          ⚙
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileSelect}
        />

        {showSettings && (
          <div className="absolute top-full right-0 mt-2 z-50 w-72 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 p-4">
            <h3 className="font-bold text-sm mb-3 text-gray-900">Backup settings</h3>
            <label className="flex items-start gap-2 text-sm mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(meta?.autoBackupOnSave)}
                onChange={(e) => onUpdateMeta?.({ autoBackupOnSave: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                Auto-download backup when games are saved
                <span className="block text-xs text-gray-500 mt-0.5">
                  Downloads a JSON file after each add/edit/delete.
                </span>
              </span>
            </label>
            <label className="block text-xs text-gray-600">
              <span className="font-semibold uppercase text-gray-500">Remind me to export after</span>
              <select
                value={meta?.exportReminderDays ?? 7}
                onChange={(e) =>
                  onUpdateMeta?.({ exportReminderDays: parseInt(e.target.value, 10) })
                }
                className="mt-1 w-full text-sm px-2 py-1.5 border border-gray-300 rounded-md"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {(importError || importSuccess) && (
        <div
          className={`absolute top-full right-0 mt-2 z-50 max-w-sm text-sm px-3 py-2 rounded shadow-lg ${
            importError ? 'bg-red-900 text-red-100' : 'bg-green-900 text-green-100'
          }`}
        >
          {importError || importSuccess}
          <button
            type="button"
            className="ml-2 underline opacity-80"
            onClick={() => {
              setImportError(null);
              setImportSuccess(null);
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5" role="dialog">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Import Backup</h2>
            <p className="text-sm text-gray-600 mb-4">
              Found {pendingImport.players?.length ?? 0} players and{' '}
              {pendingImport.games?.length ?? 0} games exported{' '}
              {pendingImport.exportedAt
                ? `on ${new Date(pendingImport.exportedAt).toLocaleDateString()}`
                : ''}
              .
            </p>
            <div className="space-y-2 mb-4 text-sm">
              <p className="font-semibold text-gray-800">How should this import work?</p>
              <p className="text-gray-600">
                <strong>Replace</strong> — use when moving to a new device (recommended). Overwrites
                all local data with the backup.
              </p>
              <p className="text-gray-600">
                <strong>Merge</strong> — adds players and games that are not already on this device.
                Keeps existing data and fills in gaps.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmImport('merge')}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-md font-semibold text-sm"
              >
                Merge
              </button>
              <button
                type="button"
                onClick={() => confirmImport('replace')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold text-sm"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
