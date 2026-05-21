import { sortGamesNewestFirst, normalizeGameStats, formatGameTitle, formatGameDateDisplay } from './gameStats';
import { getStatEntry } from '../data/statGlossary';
import {
  getBenchmarkMetricValue,
  getBenchmarkStatusColor,
  seasonAverages,
  sumGameStats,
} from './stats';
import { buildClipsFromGames, isClipStarredForPlayer } from './filmClips';
import { getYoutubeWatchUrl } from './youtube';

export const MAX_PLAYER_CLIPS = 5;

export function isClipReviewed(player, clipId) {
  return Boolean(player?.reviewedClips?.[clipId]);
}

export function countReviewedClips(player, clipIds) {
  if (!clipIds?.length) return 0;
  return clipIds.filter((id) => isClipReviewed(player, id)).length;
}

/** Coach-written or auto-generated focus bullets for the athlete. */
export function buildFocusBullets(player, benchmarkSet, games) {
  const focus = player?.playerFocus ?? {};
  const summary = (focus.weeklySummary || '').trim();
  if (summary) {
    return summary
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, MAX_PLAYER_CLIPS);
  }

  const playerGames = games ?? [];
  const totals = sumGameStats(playerGames);
  const averages = seasonAverages(totals, playerGames.length || 1);
  const bullets = [];
  const seen = new Set();

  for (const key of focus.pinnedMetricKeys ?? []) {
    const entry = getStatEntry(key);
    const target = benchmarkSet?.targets?.find((t) => t.metricKey === key);
    if (!entry) continue;
    const blurb = entry.playerBlurb || entry.description;
    bullets.push(
      target
        ? `${blurb} — we're aiming for ${target.target12}.`
        : blurb
    );
    seen.add(key);
  }

  for (const target of (benchmarkSet?.targets ?? []).filter((t) => t.isKey)) {
    if (seen.has(target.metricKey) || bullets.length >= 3) continue;
    const val = getBenchmarkMetricValue(target.metricKey, averages);
    const color = getBenchmarkStatusColor(
      val,
      target.target12,
      target.isLowerBetter,
      target.metricKey
    );
    if (color.includes('green')) continue;

    const entry = getStatEntry(target.metricKey);
    const blurb = entry?.playerBlurb || entry?.name || target.label;
    bullets.push(`${blurb} — target: ${target.target12}.`);
    seen.add(target.metricKey);
  }

  if (bullets.length === 0) {
    bullets.push('Review your starred clips below and bring one thing to practice.');
  }

  return bullets.slice(0, MAX_PLAYER_CLIPS);
}

/** Starred clips across games, newest games first, capped for the player view. */
export function collectStarredClips(games, limit = MAX_PLAYER_CLIPS) {
  const allClips = buildClipsFromGames(games);
  const clipById = new Map(allClips.map((c) => [c.id, c]));
  const sortedGames = sortGamesNewestFirst(games ?? []);
  const result = [];

  for (const game of sortedGames) {
    for (const clipId of game.starredClipIds ?? []) {
      const clip = clipById.get(clipId);
      if (clip && isClipStarredForPlayer(game, clipId)) {
        result.push({ ...clip, game });
      }
      if (result.length >= limit) return result;
    }
  }

  return result;
}

export function buildLastGameSummary(game, player) {
  if (!game) return null;
  const stats = normalizeGameStats(game.stats);
  const takeaway = (game.playerTakeaway || '').trim();

  return {
    game,
    title: formatGameTitle(game, player),
    dateLabel: formatGameDateDisplay(game),
    takeaway,
    highlights: [
      stats.pts > 0 ? `${stats.pts} points` : null,
      stats.ast > 0 ? `${stats.ast} assists` : null,
      stats.ptch > 0 ? `${stats.ptch} paint touches` : null,
      stats.tov > 0 ? `${stats.tov} turnovers` : null,
    ].filter(Boolean),
  };
}

export function getClipWatchUrl(clip, preroll = 3) {
  if (!clip?.videoId) return null;
  const start = Math.max(0, (clip.seconds ?? 0) - preroll);
  return getYoutubeWatchUrl(clip.videoId, start);
}

export function normalizePlayerFocus(raw = {}) {
  return {
    weeklySummary: raw.weeklySummary ?? '',
    pinnedMetricKeys: Array.isArray(raw.pinnedMetricKeys) ? raw.pinnedMetricKeys : [],
  };
}

export function normalizeReviewedClips(raw = {}) {
  if (!raw || typeof raw !== 'object') return {};
  return { ...raw };
}

export const PINNABLE_METRIC_KEYS = [
  'ptch',
  'astHqpa',
  'liveBallTov',
  'tpPct',
  'ftPct',
  'defl',
  'oreb',
  'tov',
];

export function getBenchmarkStatusLabel(currentVal, target12, isLowerBetter, metricKey) {
  const color = getBenchmarkStatusColor(currentVal, target12, isLowerBetter, metricKey);
  if (color.includes('green')) return 'On track';
  if (color.includes('yellow')) return 'Approaching';
  if (color.includes('red')) return 'Needs focus';
  return 'No data';
}

export function buildBenchmarkReportRows(benchmarkSet, averages, maxRows = 5) {
  const targets = (benchmarkSet?.targets ?? []).filter((t) => t.isKey).slice(0, maxRows);

  return targets.map((t) => {
    const val = getBenchmarkMetricValue(t.metricKey, averages);
    const v = parseFloat(val);
    const display =
      Number.isNaN(v) ? '—' : `${v.toFixed(1)}${t.format ?? ''}`;

    return {
      label: t.label,
      current: display,
      target12: t.target12,
      status: getBenchmarkStatusLabel(val, t.target12, t.isLowerBetter, t.metricKey),
    };
  });
}

/** Aggregated payload for the printable / PDF player report. */
export function buildPlayerReportData({ player, games, benchmarkSet }) {
  const gameList = games ?? [];
  const focusBullets = buildFocusBullets(player, benchmarkSet, gameList);
  const lastGame = buildLastGameSummary(gameList[0] ?? null, player);
  const starredClips = collectStarredClips(gameList).map((clip) => ({
    timeStr: clip.timeStr,
    rawDesc: clip.rawDesc,
    opponent: clip.opponent,
    watchUrl: getClipWatchUrl(clip),
    reviewed: isClipReviewed(player, clip.id),
  }));
  const reviewedCount = countReviewedClips(
    player,
    collectStarredClips(gameList).map((c) => c.id)
  );

  const totals = sumGameStats(gameList);
  const averages = seasonAverages(totals, gameList.length || 1);
  const benchmarkRows = buildBenchmarkReportRows(benchmarkSet, averages);

  const pinnedKeys = player?.playerFocus?.pinnedMetricKeys ?? [];
  const pinnedBlurbs = pinnedKeys
    .map((key) => ({
      label: getStatEntry(key)?.abbrev || key,
      blurb: getStatEntry(key)?.playerBlurb || getStatEntry(key)?.description || '',
    }))
    .filter((x) => x.blurb);

  return {
    playerName: player?.displayName || 'Player',
    team: player?.team,
    season: player?.season,
    generatedAt: new Date().toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    gamesInView: gameList.length,
    focusBullets,
    lastGame,
    starredClips,
    reviewedCount,
    totalStarred: starredClips.length,
    benchmarkRows,
    pinnedBlurbs,
  };
}

export function buildPlayerReportFilename(playerName) {
  return `${(playerName || 'Player').replace(/\s+/g, '_')}_PlayerReport.pdf`;
}
