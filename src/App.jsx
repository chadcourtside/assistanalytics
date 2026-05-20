import { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import RosterTab from './components/RosterTab';
import DashboardTab from './components/DashboardTab';
import LogsTab from './components/LogsTab';
import BenchmarksTab from './components/BenchmarksTab';
import FilmRoomTab from './components/FilmRoomTab';
import PlayerSelector from './components/PlayerSelector';
import AddPlayerForm from './components/AddPlayerForm';
import StatGlossaryButton from './components/StatGlossaryButton';
import DataTransferMenu from './components/DataTransferMenu';

const TABS = ['Roster', 'Dashboard', 'Game Logs', 'Benchmarks', 'Smart Film Room'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Roster');
  const [filmGameId, setFilmGameId] = useState(null);
  const {
    state,
    activePlayer,
    activePlayerGames,
    activeBenchmarkSet,
    setActivePlayerId,
    addPlayer,
    addGame,
    updateGame,
    deleteGame,
    updateGameUrl,
    updateBenchmarkTargets,
    updatePlayer,
    importAppState,
  } = useAppState();

  const openFilmForGame = (game) => {
    if (!game) return;
    setFilmGameId(game.id);
    setActiveTab('Smart Film Room');
  };

  const navigateToPlayerTab = (tab, playerId) => {
    setActivePlayerId(playerId);
    setActiveTab(tab);
    if (tab !== 'Smart Film Room') setFilmGameId(null);
  };

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
          <div className="flex items-center gap-3 relative">
            <PlayerSelector
              players={state.players}
              activePlayerId={state.activePlayerId}
              onSelect={setActivePlayerId}
            />
            <DataTransferMenu state={state} onImport={importAppState} />
            <StatGlossaryButton />
            <AddPlayerForm onAdd={addPlayer} />
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 no-print sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'Smart Film Room') setFilmGameId(null);
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
                onUpdatePlayer={updatePlayer}
                onNavigate={navigateToPlayerTab}
              />
            )}
            {activeTab === 'Dashboard' && activePlayer && (
              <DashboardTab
                player={activePlayer}
                games={activePlayerGames}
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
              />
            )}
            {activeTab === 'Game Logs' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
            {activeTab === 'Benchmarks' && activePlayer && (
              <BenchmarksTab
                player={activePlayer}
                games={activePlayerGames}
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
                games={activePlayerGames}
                initialGameId={filmGameId}
              />
            )}
            {activeTab === 'Smart Film Room' && !activePlayer && (
              <p className="text-gray-500 text-center py-12">Select a player from the Roster or header.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
