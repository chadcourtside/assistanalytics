import { useState } from 'react';
import { formatGameTitle, formatGameSubtitle, normalizeGameStats } from '../utils/gameStats';
import { duplicateGameFormState } from '../utils/gameForm';
import { GAME_TYPE_LABELS } from '../constants/gameTypes';
import { countReviewedClips } from '../utils/playerView';
import GameFormModal from './GameFormModal';
import PlayByPlayList from './PlayByPlayList';

export default function LogsTab({
  player,
  games,
  addGame,
  updateGame,
  deleteGame,
  updateGameUrl,
  onOpenFilmClip,
  canEdit = true,
}) {
  const [modalMode, setModalMode] = useState(null);
  const [editingGame, setEditingGame] = useState(null);
  const [formSeed, setFormSeed] = useState(null);

  const openAdd = () => {
    setEditingGame(null);
    setFormSeed(null);
    setModalMode('add');
  };

  const openDuplicate = (game) => {
    setEditingGame(null);
    setFormSeed(duplicateGameFormState(game));
    setModalMode('add');
  };

  const openEdit = (game) => {
    setEditingGame(game);
    setFormSeed(null);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingGame(null);
    setFormSeed(null);
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
        <div className="flex flex-wrap gap-2 shrink-0">
          {canEdit && games.length > 0 && (
            <button
              type="button"
              onClick={() => openDuplicate(games[0])}
              className="bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2 rounded-md text-sm font-semibold"
              title="New game with same opponent and settings"
            >
              Duplicate last
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={openAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold shrink-0"
            >
              + Add Game
            </button>
          )}
        </div>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          <p className="text-lg font-medium">No games logged for {player.displayName} yet.</p>
          <p className="text-sm mt-2 mb-4">
            {canEdit ? 'Add a game to track stats and play-by-play.' : 'No games logged yet for this player.'}
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={openAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold"
            >
              + Add First Game
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h3 className="font-bold text-blue-800">Film Integration</h3>
            <p className="text-sm text-blue-700 mt-1">
              Paste a YouTube link on each game card. Play-by-play lines show clip tags — click a
              timestamp or Film to jump to Smart Film Room at that moment.
            </p>
          </div>
          {games.map((g) => {
            const s = normalizeGameStats(g.stats);
            return (
              <div key={g.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 mb-4 gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {formatGameTitle(g, player)}
                      {g.gameType && g.gameType !== 'game' && (
                        <span className="ml-2 text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 align-middle">
                          {GAME_TYPE_LABELS[g.gameType] || g.gameType}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatGameSubtitle(g, s)}
                    </p>
                    {(g.playerTakeaway || '').trim() && (
                      <p className="text-sm text-blue-800 mt-1 italic line-clamp-2">
                        Player takeaway: {g.playerTakeaway.trim()}
                      </p>
                    )}
                    {(g.starredClipIds?.length ?? 0) > 0 && (
                      <p className="text-xs text-amber-700 mt-1 font-semibold">
                        ★ {countReviewedClips(player, g.starredClipIds)}/{g.starredClipIds.length}{' '}
                        player clips reviewed
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap gap-2 no-print">
                      <button
                        type="button"
                        onClick={() => openDuplicate(g)}
                        className="text-sm px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 font-medium text-gray-700"
                      >
                        Duplicate
                      </button>
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
                  )}
                </div>
                {canEdit ? (
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
                ) : (
                  g.videoUrl && (
                    <p className="mb-4 text-sm text-gray-600 no-print">
                      YouTube: {g.videoUrl}
                    </p>
                  )
                )}
                <div className="text-sm font-mono bg-slate-50 p-4 rounded-md border border-slate-100 h-64 overflow-y-auto">
                  <PlayByPlayList game={g} onOpenFilmClip={onOpenFilmClip} />
                </div>
              </div>
            );
          })}
        </>
      )}

      {modalMode && (
        <GameFormModal
          key={formSeed ? 'duplicate' : editingGame?.id ?? 'new'}
          mode={modalMode}
          game={editingGame}
          initialForm={formSeed}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

