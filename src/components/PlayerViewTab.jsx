import { useMemo, useState } from 'react';
import {
  buildFocusBullets,
  buildLastGameSummary,
  collectStarredClips,
  countReviewedClips,
  isClipReviewed,
  getClipWatchUrl,
  PINNABLE_METRIC_KEYS,
  MAX_PLAYER_CLIPS,
} from '../utils/playerView';
import { getPlayerStatBlurb } from '../data/statGlossary';
import { getStatEntry } from '../data/statGlossary';
import ClipTypeBadges from './ClipTypeBadges';

function FocusBulletList({ bullets }) {
  if (!bullets.length) return null;
  return (
    <ul className="space-y-2">
      {bullets.map((text, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-800">
          <span className="text-blue-600 font-bold shrink-0">{i + 1}.</span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function CoachFocusEditor({ player, benchmarkSet, onSave }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(player.playerFocus?.weeklySummary ?? '');
  const [pinned, setPinned] = useState(new Set(player.playerFocus?.pinnedMetricKeys ?? []));

  const togglePin = (key) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    onSave({
      weeklySummary: summary.trim(),
      pinnedMetricKeys: [...pinned],
    });
    setOpen(false);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 no-print">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold text-slate-700 hover:text-slate-900"
      >
        {open ? '▾' : '▸'} Coach: edit weekly focus for {player.displayName}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <label className="block text-xs text-gray-600">
            <span className="font-semibold uppercase text-gray-500">Weekly focus (one line per bullet)</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder={'Attack the paint before shooting\nLimit live-ball turnovers'}
              className="mt-1 w-full text-sm px-3 py-2 border border-gray-300 rounded-md font-sans"
            />
            <span className="text-[11px] text-gray-400">
              Leave blank to auto-generate from benchmark gaps.
            </span>
          </label>
          <div>
            <span className="text-xs font-semibold uppercase text-gray-500">Pin metrics (optional)</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(benchmarkSet?.targets ?? [])
                .filter((t) => PINNABLE_METRIC_KEYS.includes(t.metricKey))
                .map((t) => (
                  <button
                    key={t.metricKey}
                    type="button"
                    onClick={() => togglePin(t.metricKey)}
                    className={`px-2 py-1 text-xs font-semibold rounded-md border ${
                      pinned.has(t.metricKey)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
          >
            Save focus
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlayerViewTab({
  player,
  games,
  benchmarkSet,
  onSavePlayerFocus,
  onMarkClipReviewed,
  onOpenFilm,
}) {
  const focusBullets = useMemo(
    () => buildFocusBullets(player, benchmarkSet, games),
    [player, benchmarkSet, games]
  );

  const lastGame = useMemo(
    () => buildLastGameSummary(games[0] ?? null, player),
    [games, player]
  );

  const starredClips = useMemo(() => collectStarredClips(games), [games]);
  const reviewedCount = useMemo(
    () => countReviewedClips(player, starredClips.map((c) => c.id)),
    [player, starredClips]
  );

  const pinnedBlurbs = useMemo(() => {
    const keys = player.playerFocus?.pinnedMetricKeys ?? [];
    return keys
      .map((key) => ({ key, blurb: getPlayerStatBlurb(key), label: getStatEntry(key)?.abbrev || key }))
      .filter((x) => x.blurb);
  }, [player]);

  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No games logged yet.</p>
        <p className="text-sm mt-2">Once games are added, your focus and film clips will show here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{player.displayName}</h2>
        <p className="text-sm text-gray-500 mt-1">Your focus — what to work on and what to watch</p>
      </div>

      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-5 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wide text-blue-200 mb-3">This week&apos;s focus</h3>
        <FocusBulletList bullets={focusBullets} />
      </section>

      {lastGame && (
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Last game</h3>
          <p className="font-bold text-lg text-gray-900">{lastGame.title}</p>
          {lastGame.dateLabel && (
            <p className="text-sm text-gray-500">{lastGame.dateLabel}</p>
          )}
          {lastGame.takeaway ? (
            <blockquote className="mt-3 pl-3 border-l-4 border-blue-500 text-gray-800 italic">
              &ldquo;{lastGame.takeaway}&rdquo;
            </blockquote>
          ) : (
            <p className="mt-3 text-sm text-gray-400 italic">No coach takeaway for this game yet.</p>
          )}
          {lastGame.highlights.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">{lastGame.highlights.join(' · ')}</p>
          )}
          {onOpenFilm && lastGame.game.videoUrl && (
            <button
              type="button"
              onClick={() => onOpenFilm(lastGame.game)}
              className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800 no-print"
            >
              Open game film →
            </button>
          )}
        </section>
      )}

      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Clips to watch
          </h3>
          {starredClips.length > 0 && (
            <span className="text-xs font-semibold text-gray-500">
              {reviewedCount}/{starredClips.length} reviewed
            </span>
          )}
        </div>
        {starredClips.length === 0 ? (
          <p className="text-sm text-gray-500">
            No starred clips yet. Your coach stars clips in Smart Film Room (★ on the playlist).
          </p>
        ) : (
          <ul className="space-y-3">
            {starredClips.map((clip) => {
              const reviewed = isClipReviewed(player, clip.id);
              const watchUrl = getClipWatchUrl(clip);
              return (
                <li
                  key={clip.id}
                  className={`p-3 rounded-lg border ${reviewed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold bg-white px-1.5 py-0.5 rounded border">
                          {clip.timeStr}
                        </span>
                        <ClipTypeBadges types={clip.types} />
                      </div>
                      <p className="font-semibold text-sm text-gray-900 mt-1">{clip.rawDesc}</p>
                      <p className="text-xs text-gray-500">vs {clip.opponent}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 no-print">
                      {watchUrl && (
                        <a
                          href={watchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-center px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Watch
                        </a>
                      )}
                      {!reviewed ? (
                        <button
                          type="button"
                          onClick={() => onMarkClipReviewed?.(clip.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-md border border-green-600 text-green-700 hover:bg-green-100"
                        >
                          Got it
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-green-700 text-center px-2">
                          ✓ Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {starredClips.length >= MAX_PLAYER_CLIPS && (
          <p className="text-[11px] text-gray-400 mt-2">
            Showing up to {MAX_PLAYER_CLIPS} starred clips (newest first).
          </p>
        )}
      </section>

      {pinnedBlurbs.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
            Metrics we&apos;re tracking
          </h3>
          <ul className="space-y-2">
            {pinnedBlurbs.map(({ key, label, blurb }) => (
              <li key={key} className="text-sm">
                <span className="font-bold text-gray-800">{label}</span>
                <span className="text-gray-600"> — {blurb}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {onSavePlayerFocus && (
        <CoachFocusEditor
          player={player}
          benchmarkSet={benchmarkSet}
          onSave={onSavePlayerFocus}
        />
      )}
    </div>
  );
}
