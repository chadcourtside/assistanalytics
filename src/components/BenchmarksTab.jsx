import { sumGameStats, seasonAverages, getBenchmarkStatusColor } from '../utils/stats';

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
      <td className={`px-4 py-3 text-center ${statusColor}`}>{v.toFixed(1)}{format}</td>
      <td className="px-4 py-3 text-center text-gray-600">{target4}</td>
      <td className={`px-4 py-3 text-center font-bold ${isKey ? 'text-blue-700' : 'text-gray-800'}`}>{target12}</td>
    </tr>
  );
}

export default function BenchmarksTab({ games }) {
  const totals = sumGameStats(games);
  const current = seasonAverages(totals, games.length);

  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Development Benchmarks</h2>
        <p className="text-gray-500 text-sm">Tracking current season averages vs 4-month and 12-month goals.</p>
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
          <BenchmarkRow label="Minutes" currentVal={current.mins} target4="16+" target12="18 - 24" />
          <BenchmarkRow label="Points" currentVal={current.pts} target4="6 - 10" target12="8 - 14" />
          <BenchmarkRow label="3PT Attempts" currentVal={current.tpa} target4="2 - 4" target12="3 - 5" isKey />
          <BenchmarkRow label="3PT %" currentVal={current.tpPct} target4="35%+" target12="35 - 38%+" format="%" isKey />
          <BenchmarkRow label="Assists" currentVal={current.ast} target4="2 - 4" target12="3 - 5" />
          <BenchmarkRow label="AST + HQPA" currentVal={current.astHqpa} target4="3 - 6" target12="5+" isKey />
          <BenchmarkRow label="Paint Touches" currentVal={current.ptch} target4="3 - 5" target12="5+" isKey />
          <BenchmarkRow label="Rebounds" currentVal={current.reb} target4="3 - 5" target12="4 - 6" />
          <BenchmarkRow label="Deflections" currentVal={current.defl} target4="2 - 4" target12="4+" />
          <BenchmarkRow label="Turnovers" currentVal={current.tov} target4="≤ 2" target12="≤ 2" isLowerBetter />
          <BenchmarkRow label="Initiator LB TOV" currentVal={current.lbTov} target4="≤ 0.5" target12="Near Zero" isKey isLowerBetter />
          <BenchmarkRow label="AST:TO Ratio" currentVal={current.astTo} target4="1.5:1" target12="2:1+" />
        </tbody>
      </table>
    </div>
  );
}
