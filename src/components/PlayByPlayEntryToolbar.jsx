import {
  addSecondsToPlayTime,
  extractTimeFromPlayLine,
  getLastPlayByPlayLine,
  getRecentPlayByPlayLines,
  extractDescriptionFromPlayLine,
  normalizePlayTimeInput,
} from '../utils/playByPlayForm';

const toolButtonClass =
  'text-xs font-semibold px-2.5 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700';

export default function PlayByPlayEntryToolbar({
  playByPlayText,
  playTime,
  onPlayTimeChange,
  onUseLastTime,
  onRepeatLastTag,
  lastTagLine,
}) {
  const recentLines = getRecentPlayByPlayLines(playByPlayText, 3);
  const normalizedTime = normalizePlayTimeInput(playTime);

  const bumpTime = (seconds) => {
    const base = normalizedTime || extractTimeFromPlayLine(getLastPlayByPlayLine(playByPlayText));
    if (!base) return;
    onPlayTimeChange(addSecondsToPlayTime(base, seconds));
  };

  return (
    <div className="space-y-2 mb-3">
      <div className="flex flex-wrap items-end gap-2 p-3 rounded-md border border-gray-200 bg-gray-50">
        <label className="text-xs text-gray-600">
          <span className="block font-semibold text-gray-500 uppercase mb-1">Clip time</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="3:50"
            value={playTime}
            onChange={(e) => onPlayTimeChange(e.target.value)}
            className="w-24 text-sm px-3 py-2 border border-gray-300 rounded-md font-mono focus:ring focus:ring-blue-200 focus:outline-none bg-white"
            aria-label="Timestamp for next play tag"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={onUseLastTime} className={toolButtonClass}>
            Copy last time
          </button>
          <button type="button" onClick={() => bumpTime(15)} className={toolButtonClass}>
            +15s
          </button>
          <button type="button" onClick={() => bumpTime(30)} className={toolButtonClass}>
            +30s
          </button>
          {lastTagLine && (
            <button type="button" onClick={onRepeatLastTag} className={toolButtonClass}>
              Repeat: {lastTagLine}
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400 flex-1 min-w-[180px]">
          Type 3:50 or 350 · time auto-advances +15s after each tag
        </p>
      </div>

      {recentLines.length > 0 && (
        <div className="text-xs text-gray-500 font-mono bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
          <span className="font-sans font-semibold text-gray-400 uppercase text-[10px] tracking-wide block mb-1">
            Recent lines
          </span>
          {recentLines.map((line) => (
            <div key={line} className="truncate">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function resolveLastTagLine(playByPlayText) {
  const last = getLastPlayByPlayLine(playByPlayText);
  const desc = extractDescriptionFromPlayLine(last);
  if (!desc || /^note:/i.test(desc)) return '';
  const short = desc.length > 18 ? `${desc.slice(0, 16)}…` : desc;
  return short;
}
