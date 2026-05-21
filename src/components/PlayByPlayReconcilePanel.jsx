import { useMemo } from 'react';
import { compareStatsToPlayByPlay } from '../utils/playByPlayStats';
import { parsePlayByPlayText } from '../utils/gameForm';

export default function PlayByPlayReconcilePanel({ stats, playByPlayText, onApplyCounts }) {
  const playByPlay = useMemo(
    () => parsePlayByPlayText(playByPlayText),
    [playByPlayText]
  );

  const { mismatches, hasPlayByPlay } = useMemo(
    () => compareStatsToPlayByPlay(stats, playByPlay),
    [stats, playByPlay]
  );

  if (!hasPlayByPlay) return null;

  if (mismatches.length === 0) {
    return (
      <div className="mb-3 p-3 rounded-md border border-green-200 bg-green-50 text-sm text-green-800">
        Play-by-play tag counts match the box score for all tracked stats.
      </div>
    );
  }

  return (
    <div className="mb-3 p-3 rounded-md border border-amber-200 bg-amber-50">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-amber-900">
          {mismatches.length} stat{mismatches.length === 1 ? '' : 's'} differ from play-by-play tags
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
      <ul className="text-xs text-amber-900 space-y-1">
        {mismatches.map((m) => (
          <li key={m.key}>
            <span className="font-bold">{m.label}</span>: box score {m.entered} · tags {m.counted}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-amber-700 mt-2">
        Notes and uncategorized lines are ignored. Paint touches on the same line as a shot still count.
      </p>
    </div>
  );
}
