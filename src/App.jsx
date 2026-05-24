import { useState, useMemo, useEffect } from 'react';
import PlayerPortalApp from './components/PlayerPortalApp';
import { readPlayerTokenFromUrl, readStoredPlayerToken } from './utils/playerPortal';
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
import DebugViewBanner, { DebugViewSwitcher } from './components/DebugViewBanner';
import { buildPlayerPortalPayload } from '../shared/playerPortalCore.js';
import { isDebugPreviewActive } from './utils/debugAccess';

import TeamNightTab from './components/TeamNightTab';
import SeasonIndicator from './components/SeasonIndicator';
import SeasonManageModal from './components/SeasonManageModal';
import { isViewer } from './utils/accessControl';

const COACH_TABS = [
  'Roster',
  'Team Night',
  'Player',
  'Dashboard',
  'Benchmarks',
  'Game Logs',
  'Smart Film Room',
];
const PARENT_TABS = [
  { id: 'Player', label: 'Focus & Film' },
  { id: 'Dashboard', label: 'Dashboard' },
];

export default function App() {
  const [playerToken] = useState(() => readPlayerTokenFromUrl() || readStoredPlayerToken());

  if (playerToken) {
    return <PlayerPortalApp initialToken={playerToken} />;
  }

  return <CoachApp />;
}

function CoachApp() {
  const [activeTab, setActiveTab] = useState('Roster');
  const [filmGameId, setFilmGameId] = useState(null);
  const [filmClipId, setFilmClipId] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [teamSettingsOpen, setTeamSettingsOpen] = useState(false);
  const [seasonManageOpen, setSeasonManageOpen] = useState(false);
  const [gameScope, setGameScope] = useState({ seasonFilter: 'current', gameTypeFilter: 'all' });
  const {
    state,
    activePlayer,
    activePlayerGames,
    activeBenchmarkSet,
    auth,
    effectiveAuth,
    isDebugAdmin,
    debugView,
    setDebugView,
    canEdit,
    syncStatus,
    syncError,
    conflictInfo,
    hasPendingSync,
    refreshSession,
    signup,
    login,
    logout,
    createTeam,
    joinTeam,
    useLocalMode,
    requestMagicLink,
    requestPasswordReset,
    resetPassword,
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
      seasonFilter: state.meta?.currentSeason ? 'current' : activePlayer?.season ? 'player' : 'all',
    }));
  }, [activePlayer?.id, activePlayer?.season, state.meta?.currentSeason]);

  const isParentView = isViewer(effectiveAuth);
  const visibleTabs = isParentView
    ? PARENT_TABS
    : COACH_TABS.map((tab) => ({ id: tab, label: tab }));

  useEffect(() => {
    if (isParentView) {
      setActiveTab('Dashboard');
    }
  }, [isParentView]);

  const scopedPlayerGames = useMemo(() => {
    if (!activePlayer) return [];
    return filterGamesByScope(activePlayerGames, activePlayer, gameScope, state.meta);
  }, [activePlayerGames, activePlayer, gameScope, state.meta]);

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

  const exitDebugPreview = () => setDebugView('actual');

  const debugSwitcher = isDebugAdmin ? (
    <DebugViewSwitcher debugView={debugView} onChange={setDebugView} compact />
  ) : null;

  if (isDebugAdmin && debugView === 'player') {
    const previewPlayerId = state.activePlayerId;
    const preview = previewPlayerId
      ? buildPlayerPortalPayload(state, previewPlayerId)
      : { error: 'Select a player from the roster first.' };

    if (preview.error) {
      return (
        <div className="min-h-screen flex flex-col bg-slate-100">
          <DebugViewBanner
            debugView={debugView}
            realRole={auth.team?.role}
            onExitPreview={exitDebugPreview}
            switcher={debugSwitcher}
          />
          <div className="flex-grow flex items-center justify-center p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-md w-full p-6 text-center space-y-3">
              <h1 className="text-lg font-bold text-gray-800">Player portal preview</h1>
              <p className="text-sm text-gray-600">{preview.error}</p>
              <p className="text-xs text-gray-400">
                Choose a player in the header dropdown, then switch back to Player portal.
              </p>
              <button
                type="button"
                onClick={exitDebugPreview}
                className="bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-md text-sm font-semibold"
              >
                Exit preview
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <DebugViewBanner
          debugView={debugView}
          realRole={auth.team?.role}
          onExitPreview={exitDebugPreview}
          switcher={debugSwitcher}
        />
        <PlayerPortalApp
          previewPayload={preview}
          previewTeamName={auth.team?.name || ''}
          onExitPreview={exitDebugPreview}
        />
      </>
    );
  }

  const showAuthGate =
    effectiveAuth.status === 'unauthed' ||
    effectiveAuth.status === 'needs_team' ||
    effectiveAuth.status === 'loading' ||
    effectiveAuth.status === 'offline_api';

  if (showAuthGate && effectiveAuth.status !== 'local') {
    return (
      <>
        {isDebugPreviewActive(debugView) && (
          <DebugViewBanner
            debugView={debugView}
            realRole={auth.team?.role}
            onExitPreview={exitDebugPreview}
            switcher={debugSwitcher}
          />
        )}
        <AuthGate
          auth={effectiveAuth}
          onSignup={signup}
          onLogin={login}
          onCreateTeam={createTeam}
          onJoinTeam={joinTeam}
          onUseLocal={useLocalMode}
          onRequestMagicLink={requestMagicLink}
          onRequestPasswordReset={requestPasswordReset}
          onResetPassword={resetPassword}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isDebugPreviewActive(debugView) && (
        <DebugViewBanner
          debugView={debugView}
          realRole={auth.team?.role}
          onExitPreview={exitDebugPreview}
          switcher={debugSwitcher}
        />
      )}
      <header className="bg-slate-900 text-white py-6 px-4 md:px-8 shadow-md no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xl">#</span>
              Assist Analytics
            </h1>
            <p className="text-slate-400 mt-1">
              {isParentView
                ? 'Parent view — player focus and season stats'
                : 'Player Development & Film Review'}
            </p>
            <div className="mt-2">
              <SeasonIndicator
                meta={state.meta}
                canEdit={canEdit}
                onManage={canEdit ? () => setSeasonManageOpen(true) : undefined}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative">
            <SyncStatus
              auth={auth}
              syncStatus={syncStatus}
              syncError={syncError}
              conflictInfo={conflictInfo}
              hasPendingSync={hasPendingSync}
              onAcceptCloud={acceptCloudConflict}
              onRetry={retryCloudSync}
              onLogout={logout}
            />
            <div className="flex items-center gap-3 relative">
            {isDebugAdmin && (
              <DebugViewSwitcher debugView={debugView} onChange={setDebugView} variant="header" />
            )}
            {effectiveAuth.status === 'authed' && effectiveAuth.team && canEdit && (
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
            {activePlayer && canEdit && !isParentView && (
              <button
                type="button"
                onClick={() => openEditPlayer(activePlayer)}
                className="text-sm border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-md font-semibold whitespace-nowrap"
                title="Edit name, jersey, and team"
              >
                Edit Player
              </button>
            )}
            {!isParentView && (
              <>
                <DataTransferMenu
                  meta={state.meta}
                  onExport={recordExport}
                  onImport={importAppState}
                  onUpdateMeta={updateMeta}
                  canEdit={canEdit}
                />
                <StatGlossaryButton />
                <AddPlayerForm onAdd={addPlayer} canEdit={canEdit} />
              </>
            )}
            {isParentView && <StatGlossaryButton />}
            </div>
          </div>
        </div>
      </header>

      <BackupReminderBanner
        meta={state.meta}
        onExport={recordExport}
        onDismiss={snoozeBackupReminder}
      />

      {isParentView && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 text-sm text-center py-2 px-4">
          Parent view — select your player above to see their focus and dashboard stats.
        </div>
      )}

      {effectiveAuth.team?.role === 'viewer' && !isParentView && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-900 text-sm text-center py-2 px-4">
          View-only team access — contact your coach to log stats.
        </div>
      )}

      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 no-print sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'Smart Film Room') clearFilmNavigation();
              }}
              className={`whitespace-nowrap px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {state.players.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            {isParentView
              ? 'No players on this team yet. Ask your coach to add your athlete.'
              : 'Add a player to get started.'}
          </p>
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
                canEdit={canEdit}
              />
            )}
            {activeTab === 'Player' && activePlayer && (
              <PlayerViewTab
                player={activePlayer}
                games={scopedPlayerGames}
                benchmarkSet={activeBenchmarkSet}
                onSavePlayerFocus={canEdit ? (focus) => updatePlayerFocus(activePlayer.id, focus) : undefined}
                onMarkClipReviewed={canEdit ? (clipId) => markClipReviewed(activePlayer.id, clipId) : undefined}
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
                meta={state.meta}
              />
            )}
            {activeTab === 'Dashboard' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
            {activeTab === 'Game Logs' && activePlayer && (
              <LogsTab
                player={activePlayer}
                games={activePlayerGames}
                meta={state.meta}
                addGame={addGame}
                updateGame={updateGame}
                deleteGame={deleteGame}
                updateGameUrl={updateGameUrl}
                onOpenFilmClip={openFilmForClip}
                canEdit={canEdit}
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
                canEdit={canEdit}
                meta={state.meta}
              />
            )}
            {activeTab === 'Benchmarks' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
            {activeTab === 'Team Night' && (
              <TeamNightTab players={state.players} games={state.games} meta={state.meta} />
            )}
            {activeTab === 'Smart Film Room' && activePlayer && (
              <FilmRoomTab
                player={activePlayer}
                games={scopedPlayerGames}
                gameScope={gameScope}
                onGameScopeChange={setGameScope}
                initialGameId={filmGameId}
                initialClipId={filmClipId}
                onToggleStarredClip={canEdit ? toggleStarredClip : undefined}
                meta={state.meta}
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
          cloudEnabled={auth.status === 'authed' && !!auth.team && canEdit}
        />
      )}

      {teamSettingsOpen && effectiveAuth.status === 'authed' && (
        <TeamSettingsModal
          auth={effectiveAuth}
          onClose={() => setTeamSettingsOpen(false)}
          onMembershipChanged={refreshSession}
        />
      )}

      {seasonManageOpen && canEdit && (
        <SeasonManageModal
          meta={state.meta}
          onSave={(nextMeta) => {
            updateMeta(nextMeta);
            setSeasonManageOpen(false);
          }}
          onClose={() => setSeasonManageOpen(false)}
        />
      )}
    </div>
  );
}
