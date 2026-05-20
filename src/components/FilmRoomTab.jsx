import { useState, useMemo, useEffect } from 'react';
import { getYoutubeId } from '../utils/youtube';
import { FILM_FILTERS, playEventMatchesFilter, playEventsFromPlayByPlay } from '../utils/playEvents';

export default function FilmRoomTab({ player, games, initialGameId = null }) {
  const [filter, setFilter] = useState('all');
  const [currentClip, setCurrentClip] = useState(null);

  const allClips = useMemo(() => {
    return games.reduce((acc, game) => {
      const videoId = getYoutubeId(game.videoUrl);
      if (!videoId) return acc;

      const events = game.playEvents?.length
        ? game.playEvents
        : playEventsFromPlayByPlay(game.playByPlay || []);

      const clips = events
        .map((event, index) => {
          if (!event.timeStr) return null;
          const timeStr = event.timeStr ?? '';
          const seconds = event.seconds ?? 0;
          const description = event.description ?? event.raw ?? '';
          return {
            id: `${game.id}-${index}`,
            gameId: game.id,
            opponent: game.opponent,
            videoId,
            timeStr,
            seconds,
            rawDesc: description,
            types: event.types ?? ['other'],
          };
        })
        .filter(Boolean);

      return [...acc, ...clips];
    }, []);
  }, [games]);

  const filteredClips = useMemo(
    () => allClips.filter((c) => playEventMatchesFilter(c, filter)),
    [allClips, filter]
  );

  useEffect(() => {
    if (!initialGameId || allClips.length === 0) return;
    const first = allClips.find((c) => c.gameId === initialGameId);
    if (first) setCurrentClip(first);
  }, [initialGameId, allClips]);

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No games for {player?.displayName} yet.</p>
        <p className="text-sm mt-2">Add a game in Game Logs and paste a YouTube link to use the film room.</p>
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
                  <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded">vs {currentClip.opponent}</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">@ {currentClip.timeStr}</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center min-h-[400px]">
              <h2 className="text-2xl font-bold text-slate-400 mb-2">Smart Film Room</h2>
              <p className="max-w-md">Select a clip from the playlist. Filters use structured play tags parsed from your play-by-play lines.</p>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md flex flex-col h-full border border-gray-200">
        <div className="p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Automated Playlist</h2>
          <div className="flex flex-wrap gap-2">
            {FILM_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${filter === f.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
          {allClips.length === 0 ? (
            <div className="text-center p-6 text-gray-400 text-sm">No clips available. Paste a YouTube link in Game Logs.</div>
          ) : filteredClips.length === 0 ? (
            <div className="text-center p-6 text-gray-400 text-sm">No clips found for &quot;{FILM_FILTERS.find((f) => f.id === filter)?.label ?? filter}&quot;.</div>
          ) : (
            <div className="space-y-2">
              {filteredClips.map((clip) => {
                const isActive = currentClip && currentClip.id === clip.id;
                return (
                  <div
                    key={clip.id}
                    onClick={() => setCurrentClip(clip)}
                    className={`p-3 rounded-lg cursor-pointer border transition-all flex gap-3 ${isActive ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                  >
                    <div className={`w-12 h-12 shrink-0 rounded flex flex-col items-center justify-center font-mono font-bold text-xs ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <span>{clip.timeStr}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate text-sm ${isActive ? 'text-blue-900' : 'text-gray-800'}`}>{clip.rawDesc}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">vs {clip.opponent}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-100 border-t border-gray-200 text-xs text-center text-gray-500 font-medium shrink-0">
          {filteredClips.length} clips found
        </div>
      </div>
    </div>
  );
}
