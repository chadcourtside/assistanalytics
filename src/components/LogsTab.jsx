import { useState } from 'react';
import { getYoutubeId, parseTime } from '../utils/youtube';
import { formatGameTitle, formatGameSubtitle, normalizeGameStats } from '../utils/gameStats';
import GameFormModal from './GameFormModal';

export default function LogsTab({
  player,
  games,
  addGame,
  updateGame,
  deleteGame,
  updateGameUrl,
}) {
  const [modalMode, setModalMode] = useState(null);
  const [editingGame, setEditingGame] = useState(null);

  const openAdd = () => {
    setEditingGame(null);
    setModalMode('add');
  };

  const openEdit = (game) => {
    setEditingGame(game);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingGame(null);
  };

  const handleSave = (payload) => {
    if (modalMode === 'edit' && editingGame) {
      updateGame(editingGame.id, payload);
    } else {
      addGame(payload);
    }
    closeModal();
  };

  const handleDelete = (game) => {
    const label = formatGameTitle(game, player);
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      deleteGame(game.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Game Logs</h2>
          <p className="text-sm text-gray-500">{player.displayName}</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold shrink-0"
        >
          + Add Game
        </button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          <p className="text-lg font-medium">No games logged for {player.displayName} yet.</p>
          <p className="text-sm mt-2 mb-4">Add a game to track stats and play-by-play.</p>
          <button
            type="button"
            onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold"
          >
            + Add First Game
          </button>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-bold text-blue-800">Film Integration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Paste a YouTube link on each game card, or include it when adding/editing a game.
              Timestamps in play-by-play become clickable links in the Smart Film Room.
            </p>
          </div>
          {games.map((g) => {
            const ytId = getYoutubeId(g.videoUrl);
            const s = normalizeGameStats(g.stats);
            return (
              <div key={g.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 mb-4 gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {formatGameTitle(g, player)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatGameSubtitle(g, s)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 no-print">
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 font-medium text-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g)}
                      className="text-sm px-3 py-1.5 rounded-md border border-red-200 hover:bg-red-50 font-medium text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mb-4 no-print">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    YouTube Link
                  </label>
                  <input
                    type="text"
                    placeholder="Paste YouTube Link here..."
                    value={g.videoUrl || ''}
                    onChange={(e) => updateGameUrl(g.id, e.target.value)}
                    className="w-full md:w-96 text-sm px-3 py-2 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none"
                  />
                </div>
                <div className="text-sm font-mono bg-slate-50 p-4 rounded-md border border-slate-100 h-64 overflow-y-auto">
                  {g.playByPlay && g.playByPlay.length > 0 ? (
                    g.playByPlay.map((play, idx) => {
                      const timeMatch = play.match(/\[?\s*(\d{1,2}:\d{2})\s*\]?/);
                      const timeStr = timeMatch ? timeMatch[1] : null;
                      const sec = timeStr ? parseTime(timeStr) : 0;
                      return (
                        <div
                          key={idx}
                          className="mb-2 pl-2 border-l-2 border-gray-300 flex items-start gap-2"
                        >
                          {timeStr && ytId ? (
                            <a
                              href={`https://www.youtube.com/watch?v=${ytId}&t=${sec}s`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-bold hover:underline shrink-0 bg-blue-100 px-1 rounded"
                            >
                              [{timeStr}]
                            </a>
                          ) : timeStr ? (
                            <span className="text-gray-500 font-bold shrink-0">[{timeStr}]</span>
                          ) : null}
                          <span className="text-gray-700">
                            {play.replace(/\[?\s*\d{1,2}:\d{2}\s*\]?/, '').trim()}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 italic">No play-by-play logged.</p>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {modalMode && (
        <GameFormModal
          mode={modalMode}
          game={editingGame}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

