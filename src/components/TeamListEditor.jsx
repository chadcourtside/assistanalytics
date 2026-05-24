import { useState } from 'react';

const inputClass =
  'w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:outline-none';

export default function TeamListEditor({ teams, onChange, idPrefix = 'team' }) {
  const [draft, setDraft] = useState('');

  const addTeam = () => {
    const trimmed = draft.trim();
    if (!trimmed || teams.includes(trimmed)) {
      setDraft('');
      return;
    }
    onChange([...teams, trimmed]);
    setDraft('');
  };

  const removeTeam = (label) => {
    onChange(teams.filter((team) => team !== label));
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1" htmlFor={`${idPrefix}-draft`}>
        Teams
      </label>
      {teams.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2">
          {teams.map((team) => (
            <li
              key={team}
              className="inline-flex items-center gap-1 text-sm bg-slate-100 text-slate-800 px-2 py-1 rounded-full"
            >
              <span>{team}</span>
              <button
                type="button"
                onClick={() => removeTeam(team)}
                className="text-slate-500 hover:text-slate-800 leading-none"
                aria-label={`Remove ${team}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id={`${idPrefix}-draft`}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTeam();
            }
          }}
          placeholder="e.g. 7th Grade Gold"
          className={inputClass}
        />
        <button
          type="button"
          onClick={addTeam}
          className="shrink-0 bg-slate-100 hover:bg-slate-200 text-gray-700 px-3 py-2 rounded-md text-sm font-semibold"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Add every team this player is on (school, club, etc.). They appear on the Roster under each team.
      </p>
    </div>
  );
}
