import { useMemo, useState } from 'react';
import {
  groupPlayersByTeam,
  buildPlayerRosterSummary,
  getTeamList,
} from '../utils/roster';
import EditPlayerModal from './EditPlayerModal';

function BenchmarkPill({ onTrack, total }) {
  if (total === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const allOnTrack = onTrack === total;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        allOnTrack
          ? 'bg-green-100 text-green-800'
          : onTrack > 0
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-600'
      }`}
    >
      {onTrack}/{total} key
    </span>
  );
}

function PlayerRow({ player, summary, isActive, onSelect, onEdit, onViewDashboard, onAddGame }) {
  return (
    <tr className={`border-b ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onSelect(player.id)}
          className="text-left font-semibold text-gray-900 hover:text-blue-700"
        >
          {player.displayName}
          {player.jerseyNumber && (
            <span className="text-gray-400 font-normal ml-1">#{player.jerseyNumber}</span>
          )}
        </button>
        {player.position && (
          <span className="block text-xs text-gray-400">{player.position}</span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-gray-700">{summary.gameCount}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={summary.lastGameLabel}>
        {summary.lastGameLabel}
      </td>
      <td className="px-4 py-3 text-center font-medium">
        {summary.gameCount > 0 ? summary.averages.pts.toFixed(1) : '—'}
      </td>
      <td className="px-4 py-3 text-center font-medium">
        {summary.gameCount > 0 ? summary.averages.astHqpa.toFixed(1) : '—'}
      </td>
      <td className="px-4 py-3 text-center font-medium">
        {summary.gameCount > 0 ? summary.averages.ptch.toFixed(1) : '—'}
      </td>
      <td className="px-4 py-3 text-center">
        <BenchmarkPill
          onTrack={summary.benchmarks.onTrack}
          total={summary.benchmarks.total}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1 justify-end">
          <button
            type="button"
            onClick={() => onViewDashboard(player.id)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-semibold"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onAddGame(player.id)}
            className="text-xs border border-gray-300 hover:bg-gray-50 text-gray-700 px-2 py-1 rounded font-semibold"
          >
            Add Game
          </button>
          <button
            type="button"
            onClick={() => onEdit(player)}
            className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 font-semibold"
          >
            Edit
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function RosterTab({
  players,
  games,
  benchmarkSets,
  activePlayerId,
  onSelectPlayer,
  onUpdatePlayer,
  onNavigate,
}) {
  const [teamFilter, setTeamFilter] = useState('all');
  const [editingPlayer, setEditingPlayer] = useState(null);

  const teams = useMemo(() => getTeamList(players), [players]);

  const benchmarkByPlayer = useMemo(() => {
    const map = new Map();
    for (const b of benchmarkSets) {
      map.set(b.playerId, b);
    }
    return map;
  }, [benchmarkSets]);

  const grouped = useMemo(
    () => groupPlayersByTeam(players, teamFilter),
    [players, teamFilter]
  );

  const summaries = useMemo(() => {
    const map = new Map();
    for (const p of players) {
      map.set(
        p.id,
        buildPlayerRosterSummary(p, games, benchmarkByPlayer.get(p.id))
      );
    }
    return map;
  }, [players, games, benchmarkByPlayer]);

  const handleSavePlayer = (updates) => {
    if (editingPlayer) {
      onUpdatePlayer(editingPlayer.id, updates);
      setEditingPlayer(null);
    }
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No players on the roster yet.</p>
        <p className="text-sm mt-2">Use + Add Player in the header to create your first player.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Roster</h2>
          <p className="text-sm text-gray-500 mt-1">
            {players.length} player{players.length !== 1 ? 's' : ''} across{' '}
            {teams.length} team{teams.length !== 1 ? 's' : ''}. Click a name to switch the active player.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Filter team</span>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none"
          >
            <option value="all">All teams</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {grouped.map(({ team, players: teamPlayers }) => (
        <section
          key={team}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-bold text-lg">{team}</h3>
            <span className="text-slate-300 text-sm">
              {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2 text-center">Games</th>
                  <th className="px-4 py-2">Last game</th>
                  <th className="px-4 py-2 text-center">Pts/g</th>
                  <th className="px-4 py-2 text-center">AST+HQPA</th>
                  <th className="px-4 py-2 text-center">PTCH/g</th>
                  <th className="px-4 py-2 text-center">Key goals</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamPlayers.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    summary={summaries.get(player.id)}
                    isActive={player.id === activePlayerId}
                    onSelect={onSelectPlayer}
                    onEdit={setEditingPlayer}
                    onViewDashboard={(id) => onNavigate('Dashboard', id)}
                    onAddGame={(id) => onNavigate('Game Logs', id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="text-xs text-gray-400">
        Key goals = key benchmark indicators on track (12-month target). Edit a player to set their team name.
      </p>

      {editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          onSave={handleSavePlayer}
          onClose={() => setEditingPlayer(null)}
        />
      )}
    </div>
  );
}
