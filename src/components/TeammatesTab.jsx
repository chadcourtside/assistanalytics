import { useMemo, useState } from 'react';
import TableStatHeader from './TableStatHeader';
import { calcAstTo, calcEFG, sumGameStats } from '../utils/stats';
import { formatGameTitle, normalizeGameStats } from '../utils/gameStats';

function TeammateBoxScoreTable({ player, games }) {
  const totals = sumGameStats(games);
  const gms = games.length || 1;
  const eFgTotal = calcEFG(totals.fgm, totals.threePm, totals.fga) ?? 0;
  const astToTotal = calcAstTo(totals.ast, totals.tov);

  if (games.length === 0) {
    return <p className="text-sm text-gray-500 px-4 py-3">No games logged yet.</p>;
  }

  return (
    <div className="overflow-x-auto border-t border-gray-100">
      <table className="w-full text-sm text-left text-gray-700 whitespace-nowrap">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
          <tr>
            <th className="px-3 py-2">Game</th>
            <TableStatHeader statId="mins">MIN</TableStatHeader>
            <TableStatHeader statId="pts">PTS</TableStatHeader>
            <TableStatHeader statId="fgm">FGM/A</TableStatHeader>
            <TableStatHeader statId="threePm">3PM/A</TableStatHeader>
            <TableStatHeader statId="ftm">FTM/A</TableStatHeader>
            <TableStatHeader statId="efg" className="px-3 py-2 text-blue-600">
              eFG%
            </TableStatHeader>
            <TableStatHeader statId="reb">REB</TableStatHeader>
            <TableStatHeader statId="ast">AST</TableStatHeader>
            <TableStatHeader statId="ptch" className="px-3 py-2 text-blue-600">
              PTCH
            </TableStatHeader>
            <TableStatHeader statId="tov">TOV</TableStatHeader>
            <TableStatHeader statId="astTo" className="px-3 py-2 font-bold text-blue-600">
              A/TO
            </TableStatHeader>
            <TableStatHeader statId="plusMinus">+/-</TableStatHeader>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => {
            const s = normalizeGameStats(g.stats);
            const efg = calcEFG(s.fgm, s.threePm, s.fga);
            const ato = calcAstTo(s.ast, s.tov);
            return (
              <tr key={g.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900">
                  {formatGameTitle(g, player)}
                </td>
                <td className="px-3 py-2">{s.mins}</td>
                <td className="px-3 py-2 font-bold">{s.pts}</td>
                <td className="px-3 py-2">
                  {s.fgm}/{s.fga}
                </td>
                <td className="px-3 py-2">
                  {s.threePm}/{s.threePa}
                </td>
                <td className="px-3 py-2">
                  {s.ftm}/{s.fta}
                </td>
                <td className="px-3 py-2 text-blue-700 font-medium">
                  {efg === null ? '-' : `${efg}%`}
                </td>
                <td className="px-3 py-2">{s.reb}</td>
                <td className="px-3 py-2">{s.ast}</td>
                <td className="px-3 py-2 font-medium">{s.ptch}</td>
                <td className="px-3 py-2">{s.tov}</td>
                <td className="px-3 py-2 font-bold text-blue-700">{ato}</td>
                <td
                  className={`px-3 py-2 font-bold ${s.plusMinus > 0 ? 'text-green-600' : s.plusMinus < 0 ? 'text-red-600' : ''}`}
                >
                  {s.plusMinus > 0 ? '+' : ''}
                  {s.plusMinus}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
          <tr>
            <td className="px-3 py-3">AVG ({games.length} gp)</td>
            <td className="px-3 py-3">{(totals.mins / gms).toFixed(1)}</td>
            <td className="px-3 py-3 text-blue-700">{(totals.pts / gms).toFixed(1)}</td>
            <td className="px-3 py-3">
              {(totals.fgm / gms).toFixed(1)}/{(totals.fga / gms).toFixed(1)}
            </td>
            <td className="px-3 py-3">
              {(totals.threePm / gms).toFixed(1)}/{(totals.threePa / gms).toFixed(1)}
            </td>
            <td className="px-3 py-3">
              {(totals.ftm / gms).toFixed(1)}/{(totals.fta / gms).toFixed(1)}
            </td>
            <td className="px-3 py-3 text-blue-700">{eFgTotal}%</td>
            <td className="px-3 py-3">{(totals.reb / gms).toFixed(1)}</td>
            <td className="px-3 py-3">{(totals.ast / gms).toFixed(1)}</td>
            <td className="px-3 py-3">{(totals.ptch / gms).toFixed(1)}</td>
            <td className="px-3 py-3">{(totals.tov / gms).toFixed(1)}</td>
            <td className="px-3 py-3 text-blue-700">{astToTotal}</td>
            <td className="px-3 py-3">{(totals.plusMinus / gms).toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function TeammatesTab({ teammates, teamLabel }) {
  const [expandedId, setExpandedId] = useState(null);

  const sorted = useMemo(
    () =>
      [...(teammates || [])].sort((a, b) =>
        (a.player.displayName || '').localeCompare(b.player.displayName || '')
      ),
    [teammates]
  );

  if (!teamLabel) {
    return (
      <div className="text-center py-12 text-gray-500 space-y-2">
        <p className="text-lg font-medium">No team assigned</p>
        <p className="text-sm">Ask your coach to set your team on the roster.</p>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 space-y-2">
        <p className="text-lg font-medium">No teammates on {teamLabel}</p>
        <p className="text-sm">Box scores for teammates on your team will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Teammates</h2>
        <p className="text-sm text-gray-500">
          {teamLabel} — box score stats only (no film or play-by-play tags)
        </p>
      </div>
      <div className="space-y-3">
        {sorted.map(({ player, games }) => {
          const open = expandedId === player.id;
          return (
            <div
              key={player.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : player.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
              >
                <div>
                  <span className="font-semibold text-gray-900">{player.displayName}</span>
                  {player.jerseyNumber && (
                    <span className="text-gray-400 ml-2">#{player.jerseyNumber}</span>
                  )}
                  {player.position && (
                    <span className="text-xs text-gray-400 ml-2">{player.position}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{games.length} games</span>
                  <span className="text-gray-400">{open ? '▾' : '▸'}</span>
                </div>
              </button>
              {open && <TeammateBoxScoreTable player={player} games={games} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
