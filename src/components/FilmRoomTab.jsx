import { useState, useMemo } from 'react';
import { getYoutubeId, parseTime } from '../utils/youtube';

const FILTERS = ['All', 'Make', 'Miss', 'Assist', 'Paint Touch', 'Turnover', 'Reb/Def', 'Steal'];

function matchesFilter(clip, filter) {
  if (filter === 'All') return true;
  if (filter === 'Make') return clip.descLower.includes('make');
  if (filter === 'Miss') return clip.descLower.includes('miss');
  if (filter === 'Assist') return clip.descLower.includes('assist') || clip.descLower.includes('hqpa');
  if (filter === 'Paint Touch') return clip.descLower.includes('paint touch') || clip.descLower.includes('ptch');
  if (filter === 'Turnover') return clip.descLower.includes('tov') || clip.descLower.includes('turnover');
  if (filter === 'Reb/Def') return clip.descLower.includes('reb') || clip.descLower.includes('def');
  if (filter === 'Steal') return clip.descLower.includes('steal');
  return true;
}

export default function FilmRoomTab({ player, games }) {
  const [filter, setFilter] = useState('All');
  const [currentClip, setCurrentClip] = useState(null);

  const allClips = useMemo(() => {
    return games.reduce((acc, game) => {
      const videoId = getYoutubeId(game.videoUrl);
      if (!videoId) return acc;
      const clips = (game.playByPlay || []).map((play, index) => {
        const match = play.match(/\[?\s*(\d{1,2}:\d{2})\s*\]?\s*(.*)/);
        if (!match) return null;
        return {
          id: `${game.id}-${index}`,
          gameId: game.id,
          opponent: game.opponent,
          videoId,
          timeStr: match[1],
          seconds: parseTime(match[1]),
          rawDesc: match[2],
          descLower: match[2].toLowerCase(),
        };
      }).filter(Boolean);
      return [...acc, ...clips];
    }, []);
  }, [games]);

  const filteredClips = useMemo(() => allClips.filter((c) => matchesFilter(c, filter)), [allClips, filter]);

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No games for {player?.displayName} yet.</p>
        <p className="text-sm mt-2">Add games and YouTube links in Game Logs to use the film room.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[85vh]">
      <div className="lg:col-span-2 flex flex-col h-full">
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
          {currentClip ? (
            <>
              <iframe
                className="w-full flex-1 min-h-[300px]"
                src={`https://www.youtube.com/embed/${currentClip.videoId}?start=${currentClip.seconds > 3 ? currentClip.seconds - 3 : currentClip.seconds}&autoplay=1`}
                title="Film clip"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
              <div className="bg-slate-800 text-white p-4 shrink-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xl">{currentClip.rawDesc}</h3>
                  <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded">Game {currentClip.gameId}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">vs {currentClip.opponent} @ {currentClip.timeStr}</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center min-h-[400px]">
              <h2 className="text-2xl font-bold text-slate-400 mb-2">Smart Film Room</h2>
              <p className="max-w-md">Select a clip from the playlist. Add YouTube URLs in the Game Logs tab.</p>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md flex flex-col h-full border border-gray-200">
        <div className="p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Automated Playlist</h2>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${filter === f ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
          {allClips.length === 0 ? (
            <div className="text-center p-6 text-gray-400 text-sm">No clips available. Paste a YouTube link in Game Logs.</div>
          ) : filteredClips.length === 0 ? (
            <div className="text-center p-6 text-gray-400 text-sm">No clips found for &quot;{filter}&quot;.</div>
          ) : (
            <div className="space-y-2">
              {filteredClips.map((clip) => {
                const isActive = currentClip && currentClip.id === clip.id;
                return (
                  <div key={clip.id} onClick={() => setCurrentClip(clip)} className={`p-3 rounded-lg cursor-pointer border transition-all flex gap-3 ${isActive ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}>
                    <div className={`w-12 h-12 shrink-0 rounded flex flex-col items-center justify-center font-mono font-bold text-xs ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}><span>{clip.timeStr}</span></div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate text-sm ${isActive ? 'text-blue-900' : 'text-gray-800'}`}>{clip.rawDesc}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">Game {clip.gameId} vs {clip.opponent}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-100 border-t border-gray-200 text-xs text-center text-gray-500 font-medium shrink-0">{filteredClips.length} clips found for &quot;{filter}&quot;</div>
      </div>
    </div>
  );
}
