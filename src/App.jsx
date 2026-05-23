import { useState, useMemo, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { filterGamesByScope } from './utils/gameFilters';
import RosterTab from './components/RosterTab';
import DashboardTab from './components/DashboardTab';
import LogsTab from './components/LogsTab';
import BenchmarksTab from './components/BenchmarksTab';
import FilmRoomTab from './components/FilmRoomTab';
import PlayerSelector from './components/PlayerSelector';
import AddPlayerForm from './components/AddPlayerForm';
import StatGlossaryButton from './components/StatGlossaryButton';
import DataTransferMenu from './components/DataTransferMenu';
import BackupReminderBanner from './components/BackupReminderBanner';
import PlayerViewTab from './components/PlayerViewTab';
import AuthGate from './components/AuthGate';
import SyncStatus from './components/SyncStatus';
import TeamSettingsModal from './components/TeamSettingsModal';
import EditPlayerModal from './components/EditPlayerModal';

const TABS = ['Roster', 'Player', 'Dashboard', 'Game Logs', 'Benchmarks', 'Smart Film Room'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Roster');
  const [filmGameId, setFilmGameId] = useState(null);
  const [filmClipId, setFilmClipId] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [teamSettingsOpen, setTeamSettingsOpen] = useState(false);
  const [gameScope, setGameScope] = useState({ seasonFilter: 'all', gameTypeFilter: 'all' });
  const {
    state,
    activePlayer,
    activePlayerGames,
    activeBenchmarkSet,
    auth,
    syncStatus,
    syncError,
    conflictInfo,
    signup,
    login,
    logout,
    createTeam,
    joinTeam,
    useLocalMode,
    acceptCloudConflict,
    retryCloudSync,
    setActivePlayerId,
    addPlayer,
    addGame,
    updateGame,
    deleteGame,
    updateGameUrl,
    updateBenchmarkTargets,
    updatePlayer,
    updatePlayerFocus,
    markClipReviewed,
    toggleStarredClip,
    importAppState,
    recordExport,
    updateMeta,
    snoozeBackupReminder,
  } = useAppState();

  useEffect(() => {
    setGameScope((prev) => ({
      ...prev,
      seasonFilter: activePlayer?.season ? 'player' : 'all',
    }));
  }, [activePlayer?.id, activePlayer?.season]);

  const scopedPlayerGames = useMemo(() => {
    if (!activePlayer) return [];
    return filterGamesByScope(activePlayerGames, activePlayer, gameScope);
  }, [activePlayerGames, activePlayer, gameScope]);

  const openFilmForGame = (game) => {
    if (!game) return;
    setFilmGameId(game.id);
    setFilmClipId(null);
    setActiveTab('Smart Film Room');
  };

  const openFilmForClip = (gameId, clipId) => {
    if (!gameId || !clipId) return;
    setFilmGameId(gameId);
    setFilmClipId(clipId);
    setActiveTab('Smart Film Room');
  };

  const clearFilmNavigation = () => {
    setFilmGameId(null);
    setFilmClipId(null);
  };

  const navigateToPlayerTab = (tab, playerId) => {
    setActivePlayerId(playerId);
    setActiveTab(tab);
    if (tab !== 'Smart Film Room') clearFilmNavigation();
  };

  const handleSavePlayer = (updates) => {
    if (!editingPlayer) return;
    updatePlayer(editingPlayer.id, updates);
    setEditingPlayer(null);
  };

  const openEditPlayer = (player) => {
    if (player) setEditingPlayer(player);
  };

  const showAuthGate =
    auth.status === 'unauthed' ||
    auth.status === 'needs_team' ||
    auth.status === 'loading' ||
    auth.status === 'offline_api';

  if (showAuthGate && auth.status !== 'local') {
    return (
      <AuthGate
        auth={auth}
        onSignup={signup}
        onLogin={login}
        onCreateTeam={createTeam}
        onJoinTeam={joinTeam}
        onUseLocal={useLocalMode}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white py-6 px-4 md:px-8 shadow-md no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xl">#</span>
              Assist Analytics
            </h1>
            <p className="text-slate-400 mt-1">Player Development &amp; Film Review</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative">
            <SyncStatus
              auth={auth}
              syncStatus={syncStatus}
              syncError={syncError}
              conflictInfo={conflictInfo}
              onAcceptCloud={acceptCloudConflict}
              onRetry={retryCloudSync}
              onLogout={logout}
            />
            <div className="flex items-center gap-3 relative">
            {auth.status === 'authed' && auth.team && (
              <button
                type="button"
                onClick={() => setTeamSettingsOpen(true)}
                className="text-sm border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-md font-semibold whitespace-nowrap"
              >
                Team
              </button>
            )}
            <PlayerSelector
              players={state.players}
              activePlayerId={state.activePlayerId}
              onSelect={setActivePlayerId}
            />
            {activePlayer && (
              <button
                type="button"
                onClick={() => openEditPlayer(activePlayer)}
                className="text-sm border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-md font-semibold whitespace-nowrap"
                title="Edit name, jersey, and team"
              >
                Edit Player
              </button>
            )}
            <DataTransferMenu
              meta={state.meta}
              onExport={recordExport}
              onImport={importAppState}
              onUpdateMeta={updateMeta}
            />
            <StatGlossaryButton />
            <AddPlayerForm onAdd={addPlayer} />
            </div>
          </div>
        </div>
      </header>

      <BackupReminderBanner
        meta={state.meta}
        onExport={recordExport}
        onDismiss={snoozeBackupReminder}
      />

      {auth.team?.role === 'viewer' && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 text-sm text-center py-2 px-4">
          View-only team access — contact your coach to log stats.
        </div>
      )}

      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 no-print sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'Smart Film Room') clearFilmNavigation();
              }}
              className={`whitespace-nowrap px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {state.players.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Add a player to get started.</p>
        ) : (
          <>
            {activeTab === 'Roster' && (
              <RosterTab
                players={state.players}
                games={state.games}
                benchmarkSets={state.benchmarkSets}
                activePlayerId={state.activePlayerId}
                onSelectPlayer={setActivePlayerId}
                onEditPlayer={openEditPlayer}
                onNavigate={navigateToPlayerTab}
              />
            )}
            {activeTab === 'Player' && activePlayer && (
              <PlayerViewTab
                player={activePlayer}
                games={scopedPlayerGames}
                benchmarkSet={activeBenchmarkSet}
                onSavePlayerFocus={(focus) => updatePlayerFocus(activePlayer.id, focus)}
                onMarkClipReviewed={(clipId) => markClipReviewed(activePlayer.id, clipId)}
                onOpenFilm={openFilmForGame}
              />
            )}
            {activeTab === 'Player' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
            {activeTab === 'Dashboard' && activePlayer && (
              <DashboardTab
                player={activePlayer}
                games={scopedPlayerGames}
                totalGameCount={activePlayerGames.length}
                gameScope={gameScope}
                onGameScopeChange={setGameScope}
                onOpenFilm={openFilmForGame}
              />
            )}
            {activeTab === 'Dashboard' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
            {activeTab === 'Game Logs' && activePlayer && (
              <LogsTab
                player={activePlayer}
                games={activePlayerGames}
                addGame={addGame}
                updateGame={updateGame}
                deleteGame={deleteGame}
                updateGameUrl={updateGameUrl}
                onOpenFilmClip={openFilmForClip}
              />
            )}
            {activeTab === 'Game Logs' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
            {activeTab === 'Benchmarks' && activePlayer && (
              <BenchmarksTab
                player={activePlayer}
                games={scopedPlayerGames}
                totalGameCount={activePlayerGames.length}
                gameScope={gameScope}
                onGameScopeChange={setGameScope}
                benchmarkSet={activeBenchmarkSet}
                onSaveTargets={updateBenchmarkTargets}
              />
            )}
            {activeTab === 'Benchmarks' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
            {activeTab === 'Smart Film Room' && activePlayer && (
              <FilmRoomTab
                player={activePlayer}
                games={scopedPlayerGames}
                gameScope={gameScope}
                onGameScopeChange={setGameScope}
                initialGameId={filmGameId}
                initialClipId={filmClipId}
                onToggleStarredClip={toggleStarredClip}
              />
            )}
            {activeTab === 'Smart Film Room' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
          </>
        )}
      </main>

      {editingPlayer && (
        <EditPlayerModal
          key={editingPlayer.id}
          player={editingPlayer}
          onSave={handleSavePlayer}
          onClose={() => setEditingPlayer(null)}
        />
      )}

      {teamSettingsOpen && auth.status === 'authed' && (
        <TeamSettingsModal auth={auth} onClose={() => setTeamSettingsOpen(false)} />
      )}
    </div>
  );
}
