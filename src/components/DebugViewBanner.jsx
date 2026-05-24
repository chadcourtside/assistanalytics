import { DEBUG_VIEW_MODES, getDebugViewLabel, isDebugPreviewActive } from '../utils/debugAccess';

export default function DebugViewBanner({
  debugView,
  realRole,
  onExitPreview,
  switcher,
}) {
  if (!isDebugPreviewActive(debugView)) return null;

  return (
    <div className="bg-violet-900 text-violet-50 text-sm border-b border-violet-700 no-print">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="font-bold">Debug preview:</span>{' '}
          {getDebugViewLabel(debugView)}
          {realRole && debugView !== 'local' && debugView !== 'unauthed' && debugView !== 'needs_team' && (
            <span className="text-violet-200 ml-2">
              (session role: {realRole})
            </span>
          )}
          <span className="block text-xs text-violet-200 mt-0.5">
            UI-only preview. API calls still use your real account permissions.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {switcher}
          <button
            type="button"
            onClick={onExitPreview}
            className="text-xs font-semibold bg-violet-800 hover:bg-violet-700 border border-violet-600 px-3 py-1.5 rounded-md whitespace-nowrap"
          >
            Exit preview
          </button>
        </div>
      </div>
    </div>
  );
}

export function DebugViewSwitcher({ debugView, onChange, compact = false, variant = 'banner' }) {
  const selectClass =
    variant === 'header'
      ? 'bg-slate-800 text-slate-100 border-slate-600 focus:ring-blue-500'
      : 'bg-violet-950 text-violet-50 border-violet-600 focus:ring-violet-400';

  return (
    <label className={`inline-flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className={`font-semibold whitespace-nowrap ${variant === 'header' ? 'text-slate-300' : ''}`}>
        View as
      </span>
      <select
        value={debugView}
        onChange={(e) => onChange(e.target.value)}
        className={`${selectClass} border rounded-md font-semibold focus:outline-none focus:ring-2 ${
          compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'
        }`}
      >
        {DEBUG_VIEW_MODES.map((mode) => (
          <option key={mode.id} value={mode.id} title={mode.description}>
            {mode.label}
          </option>
        ))}
      </select>
    </label>
  );
}
