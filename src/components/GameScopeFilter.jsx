import { GAME_TYPE_OPTIONS } from '../constants/gameTypes';
import { getSeasonFilterOptions } from '../utils/gameFilters';

export default function GameScopeFilter({ player, scope, onChange, className = '' }) {
  const seasonOptions = getSeasonFilterOptions(player);

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      <label className="text-xs text-gray-600">
        <span className="block font-semibold text-gray-500 uppercase mb-1">Season</span>
        <select
          value={scope.seasonFilter}
          onChange={(e) => onChange({ ...scope, seasonFilter: e.target.value })}
          className="text-sm px-3 py-2 border border-gray-300 rounded-md bg-white"
        >
          {seasonOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-gray-600">
        <span className="block font-semibold text-gray-500 uppercase mb-1">Type</span>
        <select
          value={scope.gameTypeFilter}
          onChange={(e) => onChange({ ...scope, gameTypeFilter: e.target.value })}
          className="text-sm px-3 py-2 border border-gray-300 rounded-md bg-white"
        >
          <option value="all">All types</option>
          {GAME_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
