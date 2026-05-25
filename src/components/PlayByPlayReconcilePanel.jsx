import { useMemo } from 'react';
import { compareStatsToPlayByPlay } from '../utils/playByPlayStats';
import { parsePlayByPlayText } from '../utils/gameForm';
import { getPlayByPlayLines } from '../utils/playByPlayForm';

export default function PlayByPlayReconcilePanel({ stats, playByPlayText, onApplyCounts }) {
  const playByPlay = useMemo(
    () => parsePlayByPlayText(playByPlayText),
    [playByPlayText]
  );

  const lineCount = useMemo(() => getPlayByPlayLines(playByPlayText).length, [playByPlayText]);

  const { mismatches, hasPlayByPlay } = useMemo(
    () => compareStatsToPlayByPlay(stats, playByPlay),
    [stats, playByPlay]
  );

  if (!hasPlayByPlay && lineCount === 0) return null;

  if (!hasPlayByPlay) {
    return (
      <div className="mb-3 p-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-600">
        {lineCount} play-by-play line{lineCount === 1 ? '' : 's'} — add recognized tags so counts
        can be reconciled with the box score.
      </div>
    );
  }

  if (mismatches.length === 0) {
    return (
      <div className="mb-3 p-3 rounded-md border border-green-200 bg-green-50 text-sm text-green-800">
        {lineCount} lines · play-by-play tag counts match the box score.
      </div>
    );
  }

  return (
    <div className="mb-3 p-3 rounded-md border border-amber-200 bg-amber-50">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-amber-900">
          {lineCount} lines · {mismatches.length} stat{mismatches.length === 1 ? '' : 's'} differ
          from tags
        </p>
        {onApplyCounts && (
          <button
            type="button"
            onClick={onApplyCounts}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-700 hover:bg-amber-800 text-white"
          >
            Apply counts from play-by-play
          </button>
        )}
      </div>
      <ul className="text-xs text-amber-900 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {mismatches.map((m) => (
          <li key={m.key}>
            <span className="font-bold">{m.label}</span>: box {m.entered} · tags {m.counted}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-amber-700 mt-2">
        Notes and uncategorized lines are ignored. Compound lines (e.g. Make 2 PT, paint touch)
        count both tags.
      </p>
    </div>
  );
}
