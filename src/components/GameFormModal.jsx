import { useState } from 'react';
import {
  STAT_FIELDS,
  gameToFormState,
  validateGameForm,
  buildGamePayload,
} from '../utils/gameForm';

const inputClass =
  'w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:outline-none';

export default function GameFormModal({ mode, game, onSave, onClose }) {
  const [form, setForm] = useState(() => gameToFormState(game));
  const [errors, setErrors] = useState({});

  const title = mode === 'edit' ? 'Edit Game' : 'Add Game';

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setStat = (key, value) => {
    setForm((prev) => ({
      ...prev,
      stats: { ...prev.stats, [key]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { errors: validationErrors, stats } = validateGameForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(buildGamePayload(form, stats));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-labelledby="game-form-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h2 id="game-form-title" className="text-xl font-bold text-gray-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Opponent *
              </label>
              <input
                type="text"
                value={form.opponent}
                onChange={(e) => setField('opponent', e.target.value)}
                className={inputClass}
                required
              />
              {errors.opponent && <p className="text-red-600 text-xs mt-1">{errors.opponent}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Result</label>
              <input
                type="text"
                placeholder="e.g. W 65-42"
                value={form.result}
                onChange={(e) => setField('result', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Competition
              </label>
              <input
                type="text"
                placeholder="e.g. Lakes Tournament"
                value={form.competition}
                onChange={(e) => setField('competition', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={form.videoUrl}
                onChange={(e) => setField('videoUrl', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Box Score</h3>
            {errors.stats && <p className="text-red-600 text-xs mb-2">{errors.stats}</p>}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {STAT_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 text-center mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stats[key]}
                    onChange={(e) => setStat(key, e.target.value)}
                    className={`${inputClass} text-center px-1`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Play-by-play
            </label>
            <p className="text-xs text-gray-400 mb-2">
              One event per line. Include timestamps like 3:50 for film links.
            </p>
            <textarea
              value={form.playByPlayText}
              onChange={(e) => setField('playByPlayText', e.target.value)}
              rows={8}
              className={`${inputClass} font-mono`}
              placeholder={'0:25 Assist, paint touch\n3:50 Make 2 PT'}
            />
          </div>
        </form>

        <div className="flex gap-2 px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-md font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold text-sm"
          >
            {mode === 'edit' ? 'Save Changes' : 'Add Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
