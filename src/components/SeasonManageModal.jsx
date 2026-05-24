import { useState } from 'react';
import {
  archiveSeason,
  getArchivedSeasons,
  getWorkspaceCurrentSeason,
  setWorkspaceCurrentSeason,
} from '../utils/season';

const inputClass =
  'w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:outline-none';

export default function SeasonManageModal({ meta, onSave, onClose }) {
  const [currentSeason, setCurrentSeason] = useState(getWorkspaceCurrentSeason(meta) || '');
  const [archiveLabel, setArchiveLabel] = useState(getWorkspaceCurrentSeason(meta) || '');
  const [message, setMessage] = useState('');

  const archived = getArchivedSeasons(meta);

  const handleSaveCurrent = (e) => {
    e.preventDefault();
    onSave(setWorkspaceCurrentSeason(meta, currentSeason));
    setMessage('Current season updated.');
  };

  const handleArchive = () => {
    const result = archiveSeason(meta, archiveLabel);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    onSave(result.meta);
    setCurrentSeason(getWorkspaceCurrentSeason(result.meta) || '');
    setArchiveLabel('');
    setMessage(`Archived ${archiveLabel.trim()}. Stats remain available in season filters.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        role="dialog"
        aria-labelledby="season-manage-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 id="season-manage-title" className="text-lg font-bold text-gray-800">
            Season settings
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          <form onSubmit={handleSaveCurrent} className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase">
              Current season
            </label>
            <input
              type="text"
              value={currentSeason}
              onChange={(e) => setCurrentSeason(e.target.value)}
              placeholder="e.g. 2025-26"
              className={inputClass}
            />
            <p className="text-xs text-gray-400">
              Team-wide default for new games and filters. Players can still belong to multiple
              teams in the same season.
            </p>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold text-sm"
            >
              Save current season
            </button>
          </form>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase">
              Archive a season
            </label>
            <input
              type="text"
              value={archiveLabel}
              onChange={(e) => setArchiveLabel(e.target.value)}
              placeholder="Season label to archive"
              className={inputClass}
            />
            <p className="text-xs text-gray-400">
              Archived seasons stay in filters and reports — they are hidden from the current
              season view by default.
            </p>
            <button
              type="button"
              onClick={handleArchive}
              className="w-full bg-slate-100 hover:bg-slate-200 text-gray-800 py-2 rounded-md font-semibold text-sm"
            >
              Archive season
            </button>
          </div>

          {archived.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Archived</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                {archived.map((season) => (
                  <li key={season} className="flex items-center gap-2">
                    <span className="text-gray-400">▪</span>
                    {season}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}
