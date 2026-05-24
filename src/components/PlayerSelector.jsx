import { getPlayerTeams } from '../utils/playerTeams';

export default function PlayerSelector({ players, activePlayerId, onSelect }) {
  if (players.length === 0) {
    return <span className="text-sm text-slate-400">No players</span>;
  }

  const byTeam = new Map();
  for (const p of players) {
    const labels = getPlayerTeams(p);
    const teams = labels.length > 0 ? labels : ['No Team'];
    for (const team of teams) {
      if (!byTeam.has(team)) byTeam.set(team, []);
      if (!byTeam.get(team).some((player) => player.id === p.id)) {
        byTeam.get(team).push(p);
      }
    }
  }

  const teamEntries = [...byTeam.entries()].sort(([a], [b]) => {
    if (a === 'No Team') return 1;
    if (b === 'No Team') return -1;
    return a.localeCompare(b);
  });

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-400 hidden sm:inline">Player</span>
      <select
        value={activePlayerId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="bg-slate-800 text-white border border-slate-600 rounded-md px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[140px]"
      >
        {teamEntries.map(([team, teamPlayers]) => (
          <optgroup key={team} label={team}>
            {teamPlayers
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
              .map((p) => (
                <option key={`${team}-${p.id}`} value={p.id}>
                  {p.displayName}
                  {p.jerseyNumber ? ` #${p.jerseyNumber}` : ''}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
