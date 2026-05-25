import { useState, useRef, useMemo } from 'react';
import {
  STAT_FIELDS,
  QUICK_STAT_FIELDS,
  QUICK_INCREMENT_STATS,
  gameToFormState,
  validateGameForm,
  buildGamePayload,
  parseStatValue,
} from '../utils/gameForm';
import { GAME_TYPE_OPTIONS } from '../constants/gameTypes';
import { getPlayerTeams } from '../utils/playerTeams';
import { getWorkspaceCurrentSeason } from '../utils/season';
import { applyPlayByPlayCountsToStats } from '../utils/playByPlayStats';
import StatHelp from './StatHelp';
import PlayByPlayTagBar from './PlayByPlayTagBar';
import PlayByPlayReconcilePanel from './PlayByPlayReconcilePanel';
import PlayByPlayEntryToolbar from './PlayByPlayEntryToolbar';
import {
  insertPlayByPlayLine,
  addSecondsToPlayTime,
  extractTimeFromPlayLine,
  getLastPlayByPlayLine,
  normalizePlayTimeInput,
} from '../utils/playByPlayForm';
import NarrationImportModal from './NarrationImportModal';
import NarrationCheatSheetModal from './NarrationCheatSheetModal';

const inputClass =
  'w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:outline-none';

export default function GameFormModal({ mode, game, initialForm, player, meta, onSave, onClose }) {
  const playerTeams = getPlayerTeams(player);
  const defaultTeam = playerTeams[0] || '';
  const defaultSeason = getWorkspaceCurrentSeason(meta) || player?.season || '';

  const [form, setForm] = useState(
    () => initialForm ?? gameToFormState(game, { defaultTeam, defaultSeason })
  );
  const [errors, setErrors] = useState({});
  const [playTime, setPlayTime] = useState('');
  const [lastTagLine, setLastTagLine] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [quickLogMode, setQuickLogMode] = useState(false);
  const [narrationImportOpen, setNarrationImportOpen] = useState(false);
  const [narrationGuideOpen, setNarrationGuideOpen] = useState(false);
  const playByPlayRef = useRef(null);

  const statFields = quickLogMode ? QUICK_STAT_FIELDS : STAT_FIELDS;

  const advanceClipTime = (usedTime) => {
    const base = normalizePlayTimeInput(usedTime ?? playTime);
    if (base) setPlayTime(addSecondsToPlayTime(base, 15));
  };

  const handleAfterTagInsert = (description, usedTime) => {
    setLastTagLine(description);
    advanceClipTime(usedTime);
  };

  const handleUseLastTime = () => {
    const t = extractTimeFromPlayLine(getLastPlayByPlayLine(form.playByPlayText));
    if (t) setPlayTime(t);
  };

  const handleRepeatLastTag = () => {
    if (!lastTagLine) return;
    const next = insertPlayByPlayLine({
      currentText: form.playByPlayText,
      timeStr: playTime,
      description: lastTagLine,
      textarea: playByPlayRef.current,
    });
    setField('playByPlayText', next);
    advanceClipTime(playTime);
  };

  const insertCustomNote = () => {
    const text = customNote.trim();
    if (!text) return;
    const next = insertPlayByPlayLine({
      currentText: form.playByPlayText,
      timeStr: playTime,
      description: `Note: ${text}`,
      textarea: playByPlayRef.current,
    });
    setField('playByPlayText', next);
    setCustomNote('');
    advanceClipTime(playTime);
  };

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

  const incrementStat = (key) => {
    setForm((prev) => {
      const current = parseStatValue(prev.stats?.[key]);
      return {
        ...prev,
        stats: { ...prev.stats, [key]: current + 1 },
      };
    });
  };

  const applyFromPlayByPlay = () => {
    setForm((prev) => ({
      ...prev,
      stats: applyPlayByPlayCountsToStats(prev.stats, prev.playByPlayText),
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

  const quickIncrements = useMemo(
    () => (
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 w-full">
          Quick +1 (box score)
        </span>
        {QUICK_INCREMENT_STATS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => incrementStat(key)}
            className="px-2.5 py-1.5 text-xs font-bold rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
          >
            +1 {label}
          </button>
        ))}
      </div>
    ),
    []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-labelledby="game-form-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="game-form-title" className="text-xl font-bold text-gray-800">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => setQuickLogMode((v) => !v)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 mt-1"
            >
              {quickLogMode ? 'Show full box score' : 'Quick log mode (fewer fields)'}
            </button>
          </div>
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
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Team for this game
              </label>
              {playerTeams.length > 0 ? (
                <select
                  value={form.team}
                  onChange={(e) => setField('team', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select team…</option>
                  {playerTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. 7th Grade Gold"
                  value={form.team}
                  onChange={(e) => setField('team', e.target.value)}
                  className={inputClass}
                />
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                Which team was this game for? Important when a player is on travel and club teams.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Game type
              </label>
              <select
                value={form.gameType}
                onChange={(e) => setField('gameType', e.target.value)}
                className={inputClass}
              >
                {GAME_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Season label
              </label>
              <input
                type="text"
                placeholder="e.g. 2025-26 (optional)"
                value={form.season}
                onChange={(e) => setField('season', e.target.value)}
                className={inputClass}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Leave blank to use the player&apos;s current season for filters.
              </p>
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
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Player takeaway
            </label>
            <textarea
              value={form.playerTakeaway}
              onChange={(e) => setField('playerTakeaway', e.target.value)}
              rows={3}
              placeholder="2–3 sentences for the athlete: what went well, what to work on..."
              className={`${inputClass} font-sans`}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Shows on the Player tab — plain language for the athlete, not stat jargon.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Box Score</h3>
            {errors.stats && <p className="text-red-600 text-xs mb-2">{errors.stats}</p>}
            {quickIncrements}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {statFields.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 text-center mb-1">
                    <StatHelp statId={key}>{label}</StatHelp>
                  </label>
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Play-by-play
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setNarrationGuideOpen(true)}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  Narration guide
                </button>
                <button
                  type="button"
                  onClick={() => setNarrationImportOpen(true)}
                  className="text-xs font-semibold text-violet-700 hover:text-violet-900 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-md"
                >
                  Import from narration
                </button>
              </div>
            </div>
            <PlayByPlayReconcilePanel
              stats={form.stats}
              playByPlayText={form.playByPlayText}
              onApplyCounts={applyFromPlayByPlay}
            />
            <PlayByPlayEntryToolbar
              playByPlayText={form.playByPlayText}
              playTime={playTime}
              onPlayTimeChange={setPlayTime}
              onUseLastTime={handleUseLastTime}
              onRepeatLastTag={handleRepeatLastTag}
              lastTagLine={
                lastTagLine.length > 18 ? `${lastTagLine.slice(0, 16)}…` : lastTagLine
              }
            />
            <PlayByPlayTagBar
              playByPlayText={form.playByPlayText}
              timeStr={playTime}
              onChange={(text) => setField('playByPlayText', text)}
              textareaRef={playByPlayRef}
              onAfterInsert={handleAfterTagInsert}
              lastTagLine={lastTagLine}
              onRepeatLast={handleRepeatLastTag}
            />
            <div className="flex flex-wrap items-end gap-2 mb-2 p-3 rounded-md border border-dashed border-slate-300 bg-slate-50">
              <label className="flex-1 min-w-[200px] text-xs text-gray-600">
                <span className="block font-semibold text-gray-500 uppercase mb-1">
                  Custom note (timestamped)
                </span>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Charge taken, great closeout"
                  className={`${inputClass} w-full`}
                  aria-label="Custom play note text"
                />
              </label>
              <button
                type="button"
                onClick={insertCustomNote}
                disabled={!customNote.trim()}
                className="px-3 py-2 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-gray-700 disabled:opacity-40"
              >
                Add note
              </button>
            </div>
            <textarea
              ref={playByPlayRef}
              value={form.playByPlayText}
              onChange={(e) => setField('playByPlayText', e.target.value)}
              rows={8}
              className={`${inputClass} font-mono`}
              placeholder={'0:25 Assist, paint touch\n3:50 Make 3 PT\n4:10 Make FT\n4:10 Note: Switched onto #12 after hedge'}
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

      {narrationImportOpen && (
        <NarrationImportModal
          playerName={player?.displayName || ''}
          videoUrl={form.videoUrl}
          existingPlayByPlayText={form.playByPlayText}
          onApply={(mergedText) => {
            setField('playByPlayText', mergedText);
            setNarrationImportOpen(false);
          }}
          onClose={() => setNarrationImportOpen(false)}
        />
      )}

      {narrationGuideOpen && (
        <NarrationCheatSheetModal onClose={() => setNarrationGuideOpen(false)} />
      )}
    </div>
  );
}
