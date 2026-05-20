import StatCard from './StatCard';
import { exportPDF } from '../utils/exportPdf';
import { sumGameStats, calcEFG, calcAstTo, calcPer } from '../utils/stats';

export default function DashboardTab({ games }) {
  const totals = sumGameStats(games);
  const gms = games.length || 1;
  const eFgTotal = calcEFG(totals.fgm, totals.tpm, totals.fga) ?? 0;
  const astToTotal = calcAstTo(totals.ast, totals.tov);

  return (
    <div id="pdf-dashboard" className="print-friendly space-y-6">
      <div className="flex justify-between items-end no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Season Averages & Totals</h2>
          <p className="text-sm text-gray-500">{games.length} Games Logged</p>
        </div>
        <button type="button" onClick={() => exportPDF('pdf-dashboard', 'Avery_Dashboard.pdf')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold">Print Dashboard</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Total Mins" value={totals.mins || 0} sub={`${(totals.mins / gms).toFixed(1)}/g`} bold />
        <StatCard label="Total Pts" value={totals.pts || 0} sub={`${(totals.pts / gms).toFixed(1)}/g`} bold />
        <StatCard label="Shooting" value={`${totals.fgm || 0}/${totals.fga || 0}`} sub={`2PT: ${(totals.fgm || 0) - (totals.tpm || 0)}/${(totals.fga || 0) - (totals.tpa || 0)} | 3PT: ${totals.tpm || 0}/${totals.tpa || 0}`} />
        <StatCard label="eFG%" value={`${eFgTotal}%`} />
        <StatCard label="Total Ast" value={totals.ast || 0} sub={`${(totals.ast / gms).toFixed(1)}/g`} bold />
        <StatCard label="AST/TO" value={astToTotal} />
        <StatCard label="Paint Tch" value={totals.ptch || 0} sub={`${(totals.ptch / gms).toFixed(1)}/g`} />
        <StatCard label="Plus/Minus" value={totals.plusMinus > 0 ? `+${totals.plusMinus}` : totals.plusMinus || 0} sub="Cumulative" bold />
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">Traditional Box Score</h3>
          <button type="button" onClick={() => exportPDF('box-score-table', 'Avery_BoxScore.pdf', true)} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded no-print">Print Table (Landscape)</button>
        </div>
        <div className="overflow-x-auto" id="box-score-table">
          <table className="w-full text-sm text-left text-gray-700 whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2">Game</th><th className="px-3 py-2">MIN</th><th className="px-3 py-2">PTS</th>
                <th className="px-3 py-2">FGM/A</th><th className="px-3 py-2">3PM/A</th><th className="px-3 py-2 text-blue-600">eFG%</th>
                <th className="px-3 py-2">REB</th><th className="px-3 py-2">AST</th><th className="px-3 py-2">STL</th>
                <th className="px-3 py-2 text-blue-600">PTCH</th><th className="px-3 py-2">TOV</th><th className="px-3 py-2">LB TO</th>
                <th className="px-3 py-2 font-bold text-blue-600">A/TO</th><th className="px-3 py-2">PF</th><th className="px-3 py-2">+/-</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => {
                const efg = calcEFG(g.stats.fgm, g.stats.tpm, g.stats.fga);
                const ato = calcAstTo(g.stats.ast, g.stats.tov);
                return (
                  <tr key={g.id ?? i} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{g.opponent}</td>
                    <td className="px-3 py-2">{g.stats.mins}</td>
                    <td className="px-3 py-2 font-bold">{g.stats.pts}</td>
                    <td className="px-3 py-2">{g.stats.fgm}/{g.stats.fga}</td>
                    <td className="px-3 py-2">{g.stats.tpm}/{g.stats.tpa}</td>
                    <td className="px-3 py-2 text-blue-700 font-medium">{efg === null ? '-' : `${efg}%`}</td>
                    <td className="px-3 py-2">{g.stats.oreb + g.stats.dreb}</td>
                    <td className="px-3 py-2">{g.stats.ast}</td>
                    <td className="px-3 py-2">{g.stats.stl}</td>
                    <td className="px-3 py-2 font-medium">{g.stats.ptch}</td>
                    <td className="px-3 py-2">{g.stats.tov}</td>
                    <td className="px-3 py-2">{g.stats.lbTov}</td>
                    <td className="px-3 py-2 font-bold text-blue-700">{ato}</td>
                    <td className="px-3 py-2">{g.stats.pf}</td>
                    <td className={`px-3 py-2 font-bold ${g.stats.plusMinus > 0 ? 'text-green-600' : g.stats.plusMinus < 0 ? 'text-red-600' : ''}`}>{g.stats.plusMinus > 0 ? '+' : ''}{g.stats.plusMinus}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <tr>
                <td className="px-3 py-3">TOTALS</td>
                <td className="px-3 py-3">{totals.mins}</td>
                <td className="px-3 py-3 text-blue-700">{totals.pts}</td>
                <td className="px-3 py-3">{totals.fgm}/{totals.fga}</td>
                <td className="px-3 py-3">{totals.tpm}/{totals.tpa}</td>
                <td className="px-3 py-3 text-blue-700">{eFgTotal}%</td>
                <td className="px-3 py-3">{(totals.oreb || 0) + (totals.dreb || 0)}</td>
                <td className="px-3 py-3">{totals.ast}</td>
                <td className="px-3 py-3">{totals.stl}</td>
                <td className="px-3 py-3">{totals.ptch}</td>
                <td className="px-3 py-3">{totals.tov}</td>
                <td className="px-3 py-3">{totals.lbTov}</td>
                <td className="px-3 py-3 text-blue-700">{astToTotal}</td>
                <td className="px-3 py-3">{totals.pf}</td>
                <td className={`px-3 py-3 ${totals.plusMinus > 0 ? 'text-green-600' : totals.plusMinus < 0 ? 'text-red-600' : ''}`}>{totals.plusMinus > 0 ? '+' : ''}{totals.plusMinus}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2"><h3 className="font-bold text-blue-800">Per 24 Minutes</h3></div>
          <div className="p-4 grid grid-cols-4 gap-4 text-center">
            <div><div className="text-xl font-bold">{calcPer(totals.pts, totals.mins, 24)}</div><div className="text-xs text-gray-500 uppercase">PTS</div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.ast, totals.mins, 24)}</div><div className="text-xs text-gray-500 uppercase">AST</div></div>
            <div><div className="text-xl font-bold">{calcPer((totals.oreb || 0) + (totals.dreb || 0), totals.mins, 24)}</div><div className="text-xs text-gray-500 uppercase">REB</div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.ptch, totals.mins, 24)}</div><div className="text-xs text-gray-500 uppercase">PTCH</div></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2"><h3 className="font-bold text-slate-800">Per 32 Minutes</h3></div>
          <div className="p-4 grid grid-cols-4 gap-4 text-center">
            <div><div className="text-xl font-bold">{calcPer(totals.pts, totals.mins, 32)}</div><div className="text-xs text-gray-500 uppercase">PTS</div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.ast, totals.mins, 32)}</div><div className="text-xs text-gray-500 uppercase">AST</div></div>
            <div><div className="text-xl font-bold">{calcPer((totals.oreb || 0) + (totals.dreb || 0), totals.mins, 32)}</div><div className="text-xs text-gray-500 uppercase">REB</div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.ptch, totals.mins, 32)}</div><div className="text-xs text-gray-500 uppercase">PTCH</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
