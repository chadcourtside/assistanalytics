import { sumGameStats, seasonAverages, getBenchmarkStatusColor, getBenchmarkMetricValue } from '../utils/stats';

function BenchmarkRow({ label, currentVal, target4, target12, isKey = false, isLowerBetter = false, format = '' }) {
  const v = parseFloat(currentVal);
  const statusColor = getBenchmarkStatusColor(currentVal, target12, isLowerBetter);
  return (
    <tr className={`border-b ${isKey ? 'bg-blue-50/50' : ''}`}>
      <td className="px-4 py-3 font-medium">
        <div className="flex items-center gap-2">
          {isKey && <span className="w-2 h-2 rounded-full bg-blue-500" />}
          {label}
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

export default function BenchmarksTab({ player, games, benchmarkSet }) {
  const totals = sumGameStats(games);
  const current = seasonAverages(totals, games.length);
  const targets = benchmarkSet?.targets ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          {player.displayName} — Development Benchmarks
        </h2>
        <p className="text-gray-500 text-sm">
          {games.length === 0
            ? 'No games yet — targets shown for when games are logged.'
            : 'Tracking current season averages vs 4-month and 12-month goals.'}
        </p>
        <div className="mt-4 flex gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 inline-block rounded" /> On Track (12mo)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 inline-block rounded" /> Approaching</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 inline-block rounded-full" /> Key Indicator</span>
        </div>
      </div>
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
          {targets.map((t) => (
            <BenchmarkRow
              key={t.metricKey}
              label={t.label}
              currentVal={getBenchmarkMetricValue(t.metricKey, current) ?? 0}
              target4={t.target4}
              target12={t.target12}
              isKey={t.isKey}
              isLowerBetter={t.isLowerBetter}
              format={t.format ?? ''}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
