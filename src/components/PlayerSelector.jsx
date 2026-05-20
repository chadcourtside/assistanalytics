export default function PlayerSelector({ players, activePlayerId, onSelect }) {
  if (players.length === 0) {
    return <span className="text-sm text-slate-400">No players</span>;
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-400 hidden sm:inline">Player</span>
      <select
        value={activePlayerId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="bg-slate-800 text-white border border-slate-600 rounded-md px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[140px]"
      >
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
