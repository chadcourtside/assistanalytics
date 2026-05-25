import { useMemo } from 'react';
import StatCard from './StatCard';
import TableStatHeader from './TableStatHeader';
import StatHelp from './StatHelp';
import LastGamePanel from './LastGamePanel';
import TrendCharts from './TrendCharts';
import GameScopeFilter from './GameScopeFilter';
import { anomalyCellClass } from './AnomalyHints';
import { exportPDF } from '../utils/exportPdf';
import { sumGameStats, calcEFG, calcAstTo, calcPer } from '../utils/stats';
import { normalizeGameStats } from '../utils/gameStats';
import { detectGameAnomalies, anomaliesByKey } from '../utils/statAnomalies';

export default function DashboardTab({
  player,
  games,
  totalGameCount,
  gameScope,
  meta,
  onGameScopeChange,
  onOpenFilm,
}) {
  const totals = sumGameStats(games);
  const gms = games.length || 1;
  const eFgTotal = calcEFG(totals.fgm, totals.threePm, totals.fga) ?? 0;
  const astToTotal = calcAstTo(totals.ast, totals.tov);
  const pdfPrefix = (player?.displayName || 'Player').replace(/\s+/g, '_');

  const lastGameAnomalies = useMemo(
    () => (games.length ? detectGameAnomalies(games[0], games.slice(1)) : []),
    [games]
  );

  const rowAnomalyMaps = useMemo(
    () =>
      games.map((g, i) =>
        anomaliesByKey(detectGameAnomalies(g, games.filter((_, j) => j !== i)))
      ),
    [games]
  );

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 space-y-4">
        <p className="text-lg font-medium">
          {totalGameCount > 0
            ? 'No games match the current season/type filter.'
            : `No games logged for ${player?.displayName} yet.`}
        </p>
        {totalGameCount > 0 && gameScope && onGameScopeChange && (
          <div className="flex justify-center">
            <GameScopeFilter player={player} meta={meta} scope={gameScope} onChange={onGameScopeChange} />
          </div>
        )}
        {totalGameCount === 0 && (
          <p className="text-sm">Open Game Logs to add the first game.</p>
        )}
      </div>
    );
  }

  return (
    <div id="pdf-dashboard" className="print-friendly space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Season Averages &amp; Totals</h2>
          <p className="text-sm text-gray-500">
            {player.displayName} — {games.length} of {totalGameCount ?? games.length} games in view ·{' '}
            <span className="text-gray-400">Hover dotted stat labels for definitions</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          {gameScope && onGameScopeChange && (
            <GameScopeFilter player={player} meta={meta} scope={gameScope} onChange={onGameScopeChange} />
          )}
          <button
            type="button"
            onClick={() => exportPDF('pdf-dashboard', `${pdfPrefix}_Dashboard.pdf`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold shrink-0"
          >
            Print Dashboard
          </button>
        </div>
      </div>
      <LastGamePanel game={games[0]} onOpenFilm={onOpenFilm} anomalies={lastGameAnomalies} />
      <TrendCharts games={games} />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard statId="mins" label="Total Mins" value={totals.mins || 0} sub={`${(totals.mins / gms).toFixed(1)}/g`} bold />
        <StatCard statId="pts" label="Total Pts" value={totals.pts || 0} sub={`${(totals.pts / gms).toFixed(1)}/g`} bold />
        <StatCard
          label="Shooting"
          value={`${totals.fgm || 0}/${totals.fga || 0}`}
          sub={`2PT: ${(totals.fgm || 0) - (totals.threePm || 0)}/${(totals.fga || 0) - (totals.threePa || 0)} | 3PT: ${totals.threePm || 0}/${totals.threePa || 0}`}
        />
        <StatCard statId="efg" label="eFG%" value={`${eFgTotal}%`} />
        <StatCard statId="ast" label="Total Ast" value={totals.ast || 0} sub={`${(totals.ast / gms).toFixed(1)}/g`} bold />
        <StatCard statId="astTo" label="AST/TO" value={astToTotal} />
        <StatCard statId="ptch" label="Paint Tch" value={totals.ptch || 0} sub={`${(totals.ptch / gms).toFixed(1)}/g`} />
        <StatCard
          statId="plusMinus"
          label="Plus/Minus"
          value={totals.plusMinus > 0 ? `+${totals.plusMinus}` : totals.plusMinus || 0}
          sub="Cumulative"
          bold
        />
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">Box Scores</h3>
          <button
            type="button"
            onClick={() => exportPDF('box-score-table', `${pdfPrefix}_BoxScore.pdf`, true)}
            className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded no-print"
          >
            Print Table (Landscape)
          </button>
        </div>
        <div className="overflow-x-auto" id="box-score-table">
          <table className="w-full text-sm text-left text-gray-700 whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2">Game</th>
                <TableStatHeader statId="mins">MIN</TableStatHeader>
                <TableStatHeader statId="pts">PTS</TableStatHeader>
                <TableStatHeader statId="fgm">FGM/A</TableStatHeader>
                <TableStatHeader statId="threePm">3PM/A</TableStatHeader>
                <TableStatHeader statId="ftm">FTM/A</TableStatHeader>
                <TableStatHeader statId="efg" className="px-3 py-2 text-blue-600">eFG%</TableStatHeader>
                <TableStatHeader statId="reb">REB</TableStatHeader>
                <TableStatHeader statId="oreb">OREB</TableStatHeader>
                <TableStatHeader statId="blk">BLK</TableStatHeader>
                <TableStatHeader statId="ast">AST</TableStatHeader>
                <TableStatHeader statId="stl">STL</TableStatHeader>
                <TableStatHeader statId="ptch" className="px-3 py-2 text-blue-600">PTCH</TableStatHeader>
                <TableStatHeader statId="tov">TOV</TableStatHeader>
                <TableStatHeader statId="liveBallTov">LB TO</TableStatHeader>
                <TableStatHeader statId="astTo" className="px-3 py-2 font-bold text-blue-600">A/TO</TableStatHeader>
                <TableStatHeader statId="pf">PF</TableStatHeader>
                <TableStatHeader statId="foulsDrawn">FD</TableStatHeader>
                <TableStatHeader statId="plusMinus">+/-</TableStatHeader>
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => {
                const s = normalizeGameStats(g.stats);
                const efg = calcEFG(s.fgm, s.threePm, s.fga);
                const ato = calcAstTo(s.ast, s.tov);
                const rowAnomalies = rowAnomalyMaps[i];
                const cell = (key, content, extra = '') => (
                  <td className={`px-3 py-2 ${extra} ${anomalyCellClass(key, rowAnomalies)}`}>{content}</td>
                );
                return (
                  <tr key={g.id ?? i} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{g.opponent}</td>
                    <td className="px-3 py-2">{s.mins}</td>
                    {cell('pts', s.pts, 'font-bold')}
                    <td className="px-3 py-2">{s.fgm}/{s.fga}</td>
                    <td className="px-3 py-2">{s.threePm}/{s.threePa}</td>
                    <td className="px-3 py-2">{s.ftm}/{s.fta}</td>
                    {cell('efg', efg === null ? '-' : `${efg}%`, 'text-blue-700 font-medium')}
                    {cell('reb', s.reb)}
                    <td className="px-3 py-2">{s.oreb}</td>
                    {cell('blk', s.blk)}
                    {cell('ast', s.ast)}
                    {cell('stl', s.stl)}
                    {cell('ptch', s.ptch, 'font-medium')}
                    {cell('tov', s.tov)}
                    {cell('liveBallTov', s.liveBallTov)}
                    <td className="px-3 py-2 font-bold text-blue-700">{ato}</td>
                    <td className="px-3 py-2">{s.pf}</td>
                    <td className="px-3 py-2">{s.foulsDrawn}</td>
                    {cell(
                      'plusMinus',
                      `${s.plusMinus > 0 ? '+' : ''}${s.plusMinus}`,
                      `font-bold ${s.plusMinus > 0 ? 'text-green-600' : s.plusMinus < 0 ? 'text-red-600' : ''}`
                    )}
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
                <td className="px-3 py-3">{totals.threePm}/{totals.threePa}</td>
                <td className="px-3 py-3">{totals.ftm}/{totals.fta}</td>
                <td className="px-3 py-3 text-blue-700">{eFgTotal}%</td>
                <td className="px-3 py-3">{totals.reb}</td>
                <td className="px-3 py-3">{totals.oreb}</td>
                <td className="px-3 py-3">{totals.blk}</td>
                <td className="px-3 py-3">{totals.ast}</td>
                <td className="px-3 py-3">{totals.stl}</td>
                <td className="px-3 py-3">{totals.ptch}</td>
                <td className="px-3 py-3">{totals.tov}</td>
                <td className="px-3 py-3">{totals.liveBallTov}</td>
                <td className="px-3 py-3 text-blue-700">{astToTotal}</td>
                <td className="px-3 py-3">{totals.pf}</td>
                <td className="px-3 py-3">{totals.foulsDrawn}</td>
                <td className={`px-3 py-3 ${totals.plusMinus > 0 ? 'text-green-600' : totals.plusMinus < 0 ? 'text-red-600' : ''}`}>
                  {totals.plusMinus > 0 ? '+' : ''}{totals.plusMinus}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
            <h3 className="font-bold text-blue-800">
              <StatHelp statId="perRate">Per 24 Minutes</StatHelp>
            </h3>
          </div>
          <div className="p-4 grid grid-cols-4 gap-4 text-center">
            <div><div className="text-xl font-bold">{calcPer(totals.pts, totals.mins, 24)}</div><div className="text-xs text-gray-500 uppercase"><StatHelp statId="pts">PTS</StatHelp></div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.ast, totals.mins, 24)}</div><div className="text-xs text-gray-500 uppercase"><StatHelp statId="ast">AST</StatHelp></div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.reb, totals.mins, 24)}</div><div className="text-xs text-gray-500 uppercase"><StatHelp statId="reb">REB</StatHelp></div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.ptch, totals.mins, 24)}</div><div className="text-xs text-gray-500 uppercase"><StatHelp statId="ptch">PTCH</StatHelp></div></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
            <h3 className="font-bold text-slate-800">
              <StatHelp statId="perRate">Per 32 Minutes</StatHelp>
            </h3>
          </div>
          <div className="p-4 grid grid-cols-4 gap-4 text-center">
            <div><div className="text-xl font-bold">{calcPer(totals.pts, totals.mins, 32)}</div><div className="text-xs text-gray-500 uppercase"><StatHelp statId="pts">PTS</StatHelp></div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.ast, totals.mins, 32)}</div><div className="text-xs text-gray-500 uppercase"><StatHelp statId="ast">AST</StatHelp></div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.reb, totals.mins, 32)}</div><div className="text-xs text-gray-500 uppercase"><StatHelp statId="reb">REB</StatHelp></div></div>
            <div><div className="text-xl font-bold">{calcPer(totals.ptch, totals.mins, 32)}</div><div className="text-xs text-gray-500 uppercase"><StatHelp statId="ptch">PTCH</StatHelp></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
