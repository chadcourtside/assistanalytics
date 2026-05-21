import { getYoutubeId, parseTime } from '../utils/youtube';
import { playEventsFromPlayByPlay } from '../utils/playEvents';
import { makeClipId } from '../utils/filmClips';
import ClipTypeBadges from './ClipTypeBadges';

export default function PlayByPlayList({ game, onOpenFilmClip }) {
  const playByPlay = game?.playByPlay ?? [];
  const ytId = getYoutubeId(game?.videoUrl);
  const events = playEventsFromPlayByPlay(playByPlay);
  const parsedLines = new Set(events.map((e) => e.raw));

  if (playByPlay.length === 0) {
    return <p className="text-gray-400 italic">No play-by-play logged.</p>;
  }

  return (
    <>
      {events.map((event, index) => {
        const clipId = makeClipId(game.id, index);
        const canOpenFilm = Boolean(ytId && event.timeStr && onOpenFilmClip);
        const sec = event.seconds ?? parseTime(event.timeStr);

        return (
          <div
            key={`${clipId}-${event.raw}`}
            className="mb-2 pl-2 border-l-2 border-gray-300 flex items-start gap-2 flex-wrap"
          >
            {event.timeStr && (
              <div className="flex items-center gap-1 shrink-0">
                {canOpenFilm ? (
                  <button
                    type="button"
                    onClick={() => onOpenFilmClip(game.id, clipId)}
                    className="text-blue-600 font-bold hover:underline bg-blue-100 px-1 rounded no-print"
                    title="Open this clip in Smart Film Room"
                  >
                    [{event.timeStr}]
                  </button>
                ) : (
                  <span className="text-gray-500 font-bold">[{event.timeStr}]</span>
                )}
                {ytId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${ytId}&t=${sec}s`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-gray-400 hover:text-blue-600 no-print"
                    title="Open in YouTube"
                  >
                    ↗
                  </a>
                )}
              </div>
            )}
            <ClipTypeBadges types={event.types} />
            <span className="text-gray-700 min-w-0 flex-1">{event.description}</span>
            {canOpenFilm && (
              <button
                type="button"
                onClick={() => onOpenFilmClip(game.id, clipId)}
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shrink-0 no-print"
              >
                Film
              </button>
            )}
          </div>
        );
      })}
      {playByPlay
        .filter((line) => !parsedLines.has(String(line).trim()))
        .map((line, index) => (
          <div
            key={`raw-${index}-${line}`}
            className="mb-2 pl-2 border-l-2 border-gray-200 text-gray-500 italic"
          >
            {line}
          </div>
        ))}
    </>
  );
}
