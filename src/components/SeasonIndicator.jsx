import { getWorkspaceCurrentSeason, getArchivedSeasons } from '../utils/season';

export default function SeasonIndicator({ meta, onManage, canEdit = false }) {
  const current = getWorkspaceCurrentSeason(meta);
  const archivedCount = getArchivedSeasons(meta).length;

  if (!current && archivedCount === 0 && !canEdit) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      {current ? (
        <span className="inline-flex items-center gap-1.5 bg-emerald-900/40 text-emerald-100 border border-emerald-700/60 px-2.5 py-1 rounded-full font-semibold">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Season {current}
        </span>
      ) : (
        <span className="text-slate-400">No current season set</span>
      )}
      {archivedCount > 0 && (
        <span className="text-slate-400">{archivedCount} archived</span>
      )}
      {canEdit && onManage && (
        <button
          type="button"
          onClick={onManage}
          className="text-slate-300 hover:text-white underline underline-offset-2 font-semibold"
        >
          Manage
        </button>
      )}
    </div>
  );
}
