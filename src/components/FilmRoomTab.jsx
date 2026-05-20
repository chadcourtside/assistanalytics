import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  getYoutubeId,
  getEmbedStartSeconds,
  getYoutubeWatchUrl,
  loadFilmPreroll,
  saveFilmPreroll,
  FILM_PREROLL_OPTIONS,
} from '../utils/youtube';
import { FILM_FILTERS, playEventMatchesFilter, playEventsFromPlayByPlay } from '../utils/playEvents';

function buildClipsFromGames(games) {
  return games.reduce((acc, game) => {
    const videoId = getYoutubeId(game.videoUrl);
    if (!videoId) return acc;

    const events = playEventsFromPlayByPlay(game.playByPlay || []);

    const clips = events
      .map((event, index) => {
        if (!event.timeStr) return null;
        return {
          id: `${game.id}-${index}`,
          gameId: game.id,
          opponent: game.opponent,
          videoId,
          timeStr: event.timeStr,
          seconds: event.seconds ?? 0,
          rawDesc: event.description ?? event.raw ?? '',
          types: event.types ?? ['other'],
        };
      })
      .filter(Boolean);

    return [...acc, ...clips];
  }, []);
}

export default function FilmRoomTab({ player, games, initialGameId = null }) {
  const [filter, setFilter] = useState('all');
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [preroll, setPreroll] = useState(() => loadFilmPreroll());
  const activeRowRef = useRef(null);

  const allClips = useMemo(() => buildClipsFromGames(games), [games]);

  const filteredClips = useMemo(
    () => allClips.filter((c) => playEventMatchesFilter(c, filter)),
    [allClips, filter]
  );

  const currentIndex = useMemo(() => {
    if (!selectedClipId) return -1;
    return filteredClips.findIndex((c) => c.id === selectedClipId);
  }, [filteredClips, selectedClipId]);

  const currentClip = currentIndex >= 0 ? filteredClips[currentIndex] : null;

  const selectClipAtIndex = useCallback(
    (index) => {
      if (index < 0 || index >= filteredClips.length) {
        setSelectedClipId(null);
        return;
      }
      setSelectedClipId(filteredClips[index].id);
    },
    [filteredClips]
  );

  const goPrev = useCallback(() => {
    if (currentIndex > 0) selectClipAtIndex(currentIndex - 1);
  }, [currentIndex, selectClipAtIndex]);

  const goNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < filteredClips.length - 1) {
      selectClipAtIndex(currentIndex + 1);
    }
  }, [currentIndex, filteredClips.length, selectClipAtIndex]);

  // Clear selection when active clip is not in the filtered list
  useEffect(() => {
    if (!selectedClipId) return;
    if (!filteredClips.some((c) => c.id === selectedClipId)) {
      setSelectedClipId(null);
    }
  }, [filter, filteredClips, selectedClipId]);

  const handlePrerollChange = (value) => {
    const n = parseInt(value, 10);
    setPreroll(n);
    saveFilmPreroll(n);
  };

  useEffect(() => {
    if (!initialGameId || filteredClips.length === 0) return;
    const idx = filteredClips.findIndex((c) => c.gameId === initialGameId);
    if (idx >= 0) selectClipAtIndex(idx);
  }, [initialGameId, filteredClips, selectClipAtIndex]);

  // Scroll active row into view in playlist
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  // Keyboard: ← previous, → next (ignore when typing in inputs)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext]);

  const embedStart = currentClip
    ? getEmbedStartSeconds(currentClip.seconds, preroll)
    : 0;
  const youtubeUrl = currentClip
    ? getYoutubeWatchUrl(currentClip.videoId, embedStart)
    : null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredClips.length - 1;
  const positionLabel =
    currentIndex >= 0 && filteredClips.length > 0
      ? `Clip ${currentIndex + 1} of ${filteredClips.length}`
      : null;

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
      <div className="lg:col-span-2 flex flex-col h-full min-h-0">
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col min-h-0">
          {currentClip ? (
            <>
              <iframe
                key={`${currentClip.id}-${embedStart}`}
                className="w-full flex-1 min-h-[300px]"
                src={`https://www.youtube.com/embed/${currentClip.videoId}?start=${embedStart}&autoplay=1`}
                title="Film clip"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
              <div className="bg-slate-800 text-white p-4 shrink-0 space-y-3">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg leading-snug">{currentClip.rawDesc}</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      vs {currentClip.opponent} · @ {currentClip.timeStr}
                      {positionLabel && <span className="text-slate-500"> · {positionLabel}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 no-print">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={!hasPrev}
                    className="px-3 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Previous clip (←)"
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!hasNext}
                    className="px-3 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Next clip (→)"
                  >
                    Next →
                  </button>
                  {youtubeUrl && (
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-md text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Open in YouTube
                    </a>
                  )}
                  <label className="flex items-center gap-1.5 text-sm text-slate-300 ml-auto">
                    <span>Lead-in</span>
                    <select
                      value={preroll}
                      onChange={(e) => handlePrerollChange(e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {FILM_PREROLL_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}s
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Tip: use ← → arrow keys to move through the filtered playlist.
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center min-h-[400px]">
              <h2 className="text-2xl font-bold text-slate-400 mb-2">Smart Film Room</h2>
              <p className="max-w-md">
                Select a clip from the playlist, then use Prev/Next or ← → to run through your
                session.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md flex flex-col h-full border border-gray-200 min-h-0">
        <div className="p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Automated Playlist</h2>
          <p className="text-xs text-gray-500 mb-3">{player?.displayName}</p>
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
        <div className="flex-1 overflow-y-auto p-2 bg-gray-50 min-h-0">
          {allClips.length === 0 ? (
            <div className="text-center p-6 text-gray-400 text-sm">
              No clips available. Paste a YouTube link in Game Logs.
            </div>
          ) : filteredClips.length === 0 ? (
            <div className="text-center p-6 text-gray-400 text-sm">
              No clips found for &quot;{FILM_FILTERS.find((f) => f.id === filter)?.label ?? filter}&quot;.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClips.map((clip, index) => {
                const isActive = index === currentIndex;
                return (
                  <div
                    key={clip.id}
                    ref={isActive ? activeRowRef : null}
                    onClick={() => selectClipAtIndex(index)}
                    className={`p-3 rounded-lg cursor-pointer border transition-all flex gap-3 ${isActive ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                  >
                    <div
                      className={`w-12 h-12 shrink-0 rounded flex flex-col items-center justify-center font-mono font-bold text-xs ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      <span>{clip.timeStr}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate text-sm ${isActive ? 'text-blue-900' : 'text-gray-800'}`}
                      >
                        {clip.rawDesc}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">vs {clip.opponent}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-100 border-t border-gray-200 text-xs text-center text-gray-500 font-medium shrink-0">
          {filteredClips.length} clip{filteredClips.length !== 1 ? 's' : ''} in playlist
          {positionLabel ? ` · ${positionLabel}` : ''}
        </div>
      </div>
    </div>
  );
}
