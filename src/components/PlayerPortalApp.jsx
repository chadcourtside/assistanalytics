import { useEffect, useMemo, useState } from 'react';
import { filterGamesByScope } from '../utils/gameFilters';
import { usePlayerPortal } from '../hooks/usePlayerPortal';
import DashboardTab from './DashboardTab';
import LogsTab from './LogsTab';
import BenchmarksTab from './BenchmarksTab';
import FilmRoomTab from './FilmRoomTab';
import PlayerViewTab from './PlayerViewTab';
import TeammatesTab from './TeammatesTab';
import StatGlossaryButton from './StatGlossaryButton';

const TABS = ['My Stats', 'Dashboard', 'Game Logs', 'Benchmarks', 'Film Room', 'Teammates'];

export default function PlayerPortalApp({ initialToken }) {
  const { status, payload, teamName, error, reload, signOut } = usePlayerPortal(initialToken);
  const [activeTab, setActiveTab] = useState('My Stats');
  const [filmGameId, setFilmGameId] = useState(null);
  const [filmClipId, setFilmClipId] = useState(null);
  const [gameScope, setGameScope] = useState({ seasonFilter: 'all', gameTypeFilter: 'all' });

  const player = payload?.player ?? null;
  const games = payload?.games ?? [];
  const benchmarkSet = payload?.benchmarkSet ?? null;
  const teammates = payload?.teammates ?? [];
  const teamLabel = payload?.teamLabel ?? null;

  useEffect(() => {
    setGameScope((prev) => ({
      ...prev,
      seasonFilter: player?.season ? 'player' : 'all',
    }));
  }, [player?.id, player?.season]);

  const scopedGames = useMemo(() => {
    if (!player) return [];
    return filterGamesByScope(games, player, gameScope);
  }, [games, player, gameScope]);

  const openFilmForGame = (game) => {
    if (!game) return;
    setFilmGameId(game.id);
    setFilmClipId(null);
    setActiveTab('Film Room');
  };

  const openFilmForClip = (gameId, clipId) => {
    if (!gameId || !clipId) return;
    setFilmGameId(gameId);
    setFilmClipId(clipId);
    setActiveTab('Film Room');
  };

  const clearFilmNavigation = () => {
    setFilmGameId(null);
    setFilmClipId(null);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-gray-600">
        Loading your stats…
      </div>
    );
  }

  if (status === 'error' || status === 'signed_out' || !payload?.player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 max-w-md w-full p-6 space-y-4 text-center">
          <h1 className="text-xl font-bold text-gray-800">Player link unavailable</h1>
          <p className="text-sm text-gray-600">
            {status === 'signed_out'
              ? 'You signed out of the player portal.'
              : error || 'This player link is invalid or has been revoked.'}
          </p>
          <div className="flex flex-col gap-2">
            {status !== 'signed_out' && (
              <button
                type="button"
                onClick={reload}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold text-sm"
              >
                Try again
              </button>
            )}
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              Go to coach login
            </a>
          </div>
        </div>
      </div>
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
            <p className="text-slate-400 mt-1">
              {player.displayName}
              {teamLabel ? ` · ${teamLabel}` : ''}
              {teamName ? ` · ${teamName}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatGlossaryButton />
            <button
              type="button"
              onClick={signOut}
              className="text-sm border border-slate-600 text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-md font-semibold whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-sm text-center py-2 px-4">
        Player portal — your stats, trends, and film. Teammates show box scores only.
      </div>

      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 no-print sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'Film Room') clearFilmNavigation();
              }}
              className={`whitespace-nowrap px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'My Stats' && (
          <PlayerViewTab
            player={player}
            games={scopedGames}
            benchmarkSet={benchmarkSet}
            onOpenFilm={openFilmForGame}
          />
        )}
        {activeTab === 'Dashboard' && (
          <DashboardTab
            player={player}
            games={scopedGames}
            totalGameCount={games.length}
            gameScope={gameScope}
            onGameScopeChange={setGameScope}
            onOpenFilm={openFilmForGame}
          />
        )}
        {activeTab === 'Game Logs' && (
          <LogsTab
            player={player}
            games={games}
            onOpenFilmClip={openFilmForClip}
            canEdit={false}
          />
        )}
        {activeTab === 'Benchmarks' && (
          <BenchmarksTab
            player={player}
            games={scopedGames}
            totalGameCount={games.length}
            gameScope={gameScope}
            onGameScopeChange={setGameScope}
            benchmarkSet={benchmarkSet}
            canEdit={false}
          />
        )}
        {activeTab === 'Film Room' && (
          <FilmRoomTab
            player={player}
            games={scopedGames}
            gameScope={gameScope}
            onGameScopeChange={setGameScope}
            initialGameId={filmGameId}
            initialClipId={filmClipId}
          />
        )}
        {activeTab === 'Teammates' && (
          <TeammatesTab teammates={teammates} teamLabel={teamLabel} />
        )}
      </main>
    </div>
  );
}
