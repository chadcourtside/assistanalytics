import { useState } from 'react';
import { useGames } from './hooks/useGames';
import DashboardTab from './components/DashboardTab';
import LogsTab from './components/LogsTab';
import BenchmarksTab from './components/BenchmarksTab';
import FilmRoomTab from './components/FilmRoomTab';

const TABS = ['Dashboard', 'Game Logs', 'Benchmarks', 'Smart Film Room'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { games, updateGameUrl } = useGames();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white py-6 px-4 md:px-8 shadow-md no-print">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xl">#</span>
            Avery Analytics Pro
          </h1>
          <p className="text-slate-400 mt-1">Player Development & Video System</p>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 no-print sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex overflow-x-auto hide-scrollbar">
          {TABS.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`whitespace-nowrap px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}>{tab}</button>
          ))}
        </div>
      </nav>
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'Dashboard' && <DashboardTab games={games} />}
        {activeTab === 'Game Logs' && <LogsTab games={games} updateGameUrl={updateGameUrl} />}
        {activeTab === 'Benchmarks' && <BenchmarksTab games={games} />}
        {activeTab === 'Smart Film Room' && <FilmRoomTab games={games} />}
      </main>
    </div>
  );
}
