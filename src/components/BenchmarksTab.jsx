import { useState } from 'react';
import { sumGameStats, seasonAverages, getBenchmarkStatusColor, getBenchmarkMetricValue } from '../utils/stats';
import StatHelp from './StatHelp';
import GameScopeFilter from './GameScopeFilter';

function BenchmarkRowView({ metricKey, label, currentVal, target4, target12, isKey, isLowerBetter, format }) {
  const v = parseFloat(currentVal);
  const statusColor = getBenchmarkStatusColor(currentVal, target12, isLowerBetter, metricKey);
  return (
    <tr className={`border-b ${isKey ? 'bg-blue-50/50' : ''}`}>
      <td className="px-4 py-3 font-medium">
        <div className="flex items-center gap-2">
          {isKey && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          <StatHelp statId={metricKey}>{label}</StatHelp>
        </div>
      </td>
      <td className={`px-4 py-3 text-center ${statusColor}`}>
        {Number.isNaN(v) ? '—' : `${v.toFixed(1)}${format}`}
      </td>
      <td className="px-4 py-3 text-center text-gray-600">{target4}</td>
      <td className={`px-4 py-3 text-center font-bold ${isKey ? 'text-blue-700' : 'text-gray-800'}`}>{target12}</td>
    </tr>
  );
}

function BenchmarkRowEdit({ target, onChange }) {
  return (
    <tr className={`border-b ${target.isKey ? 'bg-blue-50/50' : ''}`}>
      <td className="px-4 py-3 font-medium">
        <div className="flex items-center gap-2">
          {target.isKey && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          <StatHelp statId={target.metricKey}>{target.label}</StatHelp>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-gray-400 text-xs">—</td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={target.target4}
          onChange={(e) => onChange(target.metricKey, 'target4', e.target.value)}
          className="w-full text-sm text-center px-2 py-1 border border-gray-300 rounded"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={target.target12}
          onChange={(e) => onChange(target.metricKey, 'target12', e.target.value)}
          className="w-full text-sm text-center px-2 py-1 border border-gray-300 rounded font-semibold"
        />
      </td>
    </tr>
  );
}

export default function BenchmarksTab({
  player,
  games,
  totalGameCount,
  gameScope,
  meta,
  onGameScopeChange,
  benchmarkSet,
  onSaveTargets,
  canEdit = true,
}) {
  const [editing, setEditing] = useState(false);
  const [draftTargets, setDraftTargets] = useState([]);

  const totals = sumGameStats(games);
  const current = seasonAverages(totals, games.length);
  const targets = benchmarkSet?.targets ?? [];

  const startEditing = () => {
    setDraftTargets(targets.map((t) => ({ ...t })));
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraftTargets([]);
  };

  const saveEditing = () => {
    onSaveTargets?.(player.id, draftTargets);
    setEditing(false);
    setDraftTargets([]);
  };

  const updateDraft = (metricKey, field, value) => {
    setDraftTargets((prev) =>
      prev.map((t) => (t.metricKey === metricKey ? { ...t, [field]: value } : t))
    );
  };

  const displayTargets = editing ? draftTargets : targets;

  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {player.displayName} — Development Benchmarks
          </h2>
          <p className="text-gray-500 text-sm">
            {games.length === 0
              ? totalGameCount > 0
                ? 'No games match the current filter — adjust season or type above.'
                : 'No games yet — targets shown for when games are logged.'
              : `Comparing ${games.length} of ${totalGameCount ?? games.length} games vs 4-month and 12-month goals.`}{' '}
            <span className="text-gray-400">Hover dotted metric names for definitions.</span>
          </p>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 inline-block rounded" /> On Track (12mo)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 inline-block rounded" /> Approaching</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 inline-block rounded-full" /> Key Indicator</span>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          {canEdit && (editing ? (
            <>
              <button type="button" onClick={cancelEditing} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md font-semibold">
                Cancel
              </button>
              <button type="button" onClick={saveEditing} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-semibold">
                Save Targets
              </button>
            </>
          ) : (
            <button type="button" onClick={startEditing} className="text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md font-semibold">
              Edit Targets
            </button>
          ))}
        </div>
      </div>
      {gameScope && onGameScopeChange && (
        <GameScopeFilter
          player={player}
          meta={meta}
          scope={gameScope}
          onChange={onGameScopeChange}
          className="no-print"
        />
      )}
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="px-4 py-3 rounded-tl-md">Metric</th>
            <th className="px-4 py-3 text-center">Current Avg</th>
            <th className="px-4 py-3 text-center">4-Month Target</th>
            <th className="px-4 py-3 text-center rounded-tr-md">12-Month Target</th>
          </tr>
        </thead>
        <tbody>
          {displayTargets.map((t) =>
            editing ? (
              <BenchmarkRowEdit key={t.metricKey} target={t} onChange={updateDraft} />
            ) : (
              <BenchmarkRowView
                key={t.metricKey}
                metricKey={t.metricKey}
                label={t.label}
                currentVal={getBenchmarkMetricValue(t.metricKey, current) ?? 0}
                target4={t.target4}
                target12={t.target12}
                isKey={t.isKey}
                isLowerBetter={t.isLowerBetter}
                format={t.format ?? ''}
              />
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
