import { useState } from 'react';

export default function AddPlayerForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [team, setTeam] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const player = onAdd({
      firstName,
      lastName,
      jerseyNumber,
      team,
    });
    if (player) {
      setFirstName('');
      setLastName('');
      setJerseyNumber('');
      setTeam('');
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-semibold whitespace-nowrap"
      >
        + Add Player
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute right-0 top-full mt-2 z-20 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 p-4 w-72"
    >
      <h3 className="font-bold text-sm mb-3">New Player</h3>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="First name *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="w-full text-sm px-3 py-2 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full text-sm px-3 py-2 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Jersey #"
          value={jerseyNumber}
          onChange={(e) => setJerseyNumber(e.target.value)}
          className="w-full text-sm px-3 py-2 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Team"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="w-full text-sm px-3 py-2 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none"
        />
      </div>
      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-md font-semibold"
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 rounded-md font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
