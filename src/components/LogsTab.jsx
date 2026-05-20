import { getYoutubeId, parseTime } from '../utils/youtube';
import { getGameDateLabel, normalizeGameStats } from '../utils/gameStats';

export default function LogsTab({ player, games, updateGameUrl }) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No games logged for {player?.displayName} yet.</p>
        <p className="text-sm mt-2">Game entry will be available in a future update.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <h3 className="font-bold text-blue-800">Film Integration</h3>
        <p className="text-sm text-blue-700 mt-1">
          Paste a YouTube link into any game card below. Timestamps become clickable links and populate the Smart Film Room for {player.displayName}.
        </p>
      </div>
      {games.map((g, index) => {
        const ytId = getYoutubeId(g.videoUrl);
        const s = normalizeGameStats(g.stats);
        const dateLabel = getGameDateLabel(g);
        return (
          <div key={g.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Game {index + 1}: vs {g.opponent}
                </h3>
                <p className="text-sm text-gray-500">
                  {dateLabel} | Result: <span className="font-semibold">{g.result}</span> | Mins: {s.mins}
                </p>
              </div>
              <div className="mt-3 md:mt-0 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Paste YouTube Link here..."
                  value={g.videoUrl || ''}
                  onChange={(e) => updateGameUrl(g.id, e.target.value)}
                  className="w-full md:w-64 text-sm px-3 py-2 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none"
                />
              </div>
            </div>
            <div className="text-sm font-mono bg-slate-50 p-4 rounded-md border border-slate-100 h-64 overflow-y-auto">
              {g.playByPlay && g.playByPlay.length > 0 ? (
                g.playByPlay.map((play, idx) => {
                  const timeMatch = play.match(/\[?\s*(\d{1,2}:\d{2})\s*\]?/);
                  const timeStr = timeMatch ? timeMatch[1] : null;
                  const sec = timeStr ? parseTime(timeStr) : 0;
                  return (
                    <div key={idx} className="mb-2 pl-2 border-l-2 border-gray-300 flex items-start gap-2">
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
    </div>
  );
}
