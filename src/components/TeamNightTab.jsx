import { useMemo, useState } from 'react';
import { groupGamesByNight, filterTeamNightsBySeason } from '../utils/teamNight';
import { getSeasonFilterOptions } from '../utils/gameFilters';
import { formatGameTitle } from '../utils/gameStats';

export default function TeamNightTab({ players, games, meta }) {
  const nights = useMemo(() => groupGamesByNight(games, players), [games, players]);
  const seasonOptions = useMemo(
    () => getSeasonFilterOptions(null, meta),
    [meta]
  );
  const [seasonFilter, setSeasonFilter] = useState('current');
  const [selectedKey, setSelectedKey] = useState(nights[0]?.key ?? '');

  const filteredNights = useMemo(
    () => filterTeamNightsBySeason(nights, meta, seasonFilter),
    [nights, meta, seasonFilter]
  );

  const activeNight =
    filteredNights.find((night) => night.key === selectedKey) ?? filteredNights[0] ?? null;

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No games logged yet.</p>
        <p className="text-sm mt-2">Team night summaries appear after games are added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Night</h2>
          <p className="text-sm text-gray-500">
            Box scores for every player who logged a game on the same date
          </p>
        </div>
        <label className="text-xs text-gray-600">
          <span className="block font-semibold text-gray-500 uppercase mb-1">Season</span>
          <select
            value={seasonFilter}
            onChange={(e) => {
              setSeasonFilter(e.target.value);
              setSelectedKey('');
            }}
            className="text-sm px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            {seasonOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredNights.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No game nights match this season filter.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b text-xs font-semibold text-gray-500 uppercase">
              Dates
            </div>
            <ul className="max-h-[480px] overflow-y-auto">
              {filteredNights.map((night) => (
                <li key={night.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(night.key)}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 hover:bg-blue-50 ${
                      activeNight?.key === night.key ? 'bg-blue-50 font-semibold text-blue-800' : 'text-gray-700'
                    }`}
                  >
                    <span className="block">{night.label}</span>
                    <span className="text-xs text-gray-400">{night.entries.length} players</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {activeNight && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-800 text-white">
                <h3 className="font-bold">{activeNight.label}</h3>
                <p className="text-xs text-slate-300">{activeNight.entries.length} players logged</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase text-gray-500 bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2">Player</th>
                      <th className="px-3 py-2">Team</th>
                      <th className="px-3 py-2">Matchup</th>
                      <th className="px-3 py-2">MIN</th>
                      <th className="px-3 py-2">PTS</th>
                      <th className="px-3 py-2">REB</th>
                      <th className="px-3 py-2">AST</th>
                      <th className="px-3 py-2">PTCH</th>
                      <th className="px-3 py-2">TOV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeNight.entries.map(({ player, game, stats }) => (
                      <tr key={`${player?.id}-${game.id}`} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {player?.displayName || 'Unknown'}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{game.team || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{formatGameTitle(game, player)}</td>
                        <td className="px-3 py-2">{stats.mins}</td>
                        <td className="px-3 py-2 font-bold">{stats.pts}</td>
                        <td className="px-3 py-2">{stats.reb}</td>
                        <td className="px-3 py-2">{stats.ast}</td>
                        <td className="px-3 py-2">{stats.ptch}</td>
                        <td className="px-3 py-2">{stats.tov}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
