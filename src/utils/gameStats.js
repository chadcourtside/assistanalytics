/**
 * Normalize game stats to canonical v1 shape (supports legacy keys).
 */
export function normalizeGameStats(raw = {}) {
  const threePm = raw.threePm ?? raw.tpm ?? 0;
  const threePa = raw.threePa ?? raw.tpa ?? 0;
  const oreb = raw.oreb ?? 0;
  const dreb = raw.dreb ?? 0;
  const reb =
    raw.reb ??
    (oreb > 0 || dreb > 0 ? oreb + dreb : 0);
  const liveBallTov = raw.liveBallTov ?? raw.lbTov ?? 0;
  const foulsDrawn = raw.foulsDrawn ?? raw.fd ?? 0;
  const ftm = raw.ftm ?? 0;
  const fta = raw.fta ?? 0;

  return {
    mins: raw.mins ?? 0,
    pts: raw.pts ?? 0,
    fgm: raw.fgm ?? 0,
    fga: raw.fga ?? 0,
    threePm,
    threePa,
    ftm,
    fta,
    oreb,
    dreb,
    reb,
    ast: raw.ast ?? 0,
    hqpa: raw.hqpa ?? 0,
    tov: raw.tov ?? 0,
    liveBallTov,
    stl: raw.stl ?? 0,
    defl: raw.defl ?? 0,
    blk: raw.blk ?? 0,
    pf: raw.pf ?? 0,
    foulsDrawn,
    ptch: raw.ptch ?? 0,
    plusMinus: raw.plusMinus ?? 0,
  };
}

/** Player or game team for matchup titles (game.team overrides player.team). */
export function getOurTeamLabel(game, player) {
  const gameTeam = (game?.team || '').trim();
  const playerTeam = (player?.team || '').trim();
  if (gameTeam) return gameTeam;
  if (playerTeam) return playerTeam;
  return player?.displayName?.trim() || 'Our Team';
}

/**
 * Display title for a game card, e.g. "7th Grade Gold vs Coyotes".
 */
export function formatGameTitle(game, player) {
  const ours = getOurTeamLabel(game, player);
  const opponent = (game?.opponent || '').trim() || 'TBD';
  return `${ours} vs ${opponent}`;
}

/** Human-friendly date for subtitles; falls back to competition label. */
export function formatGameDateDisplay(game) {
  const date = (game?.date || '').trim();
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsed = new Date(`${date}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  if (date) return date;
  const competition = (game?.competition || '').trim();
  if (competition) return competition;
  return null;
}

/**
 * Secondary line under the game title: date, competition, result, minutes.
 */
export function formatGameSubtitle(game, stats) {
  const parts = [];
  const dateDisplay = formatGameDateDisplay(game);
  if (dateDisplay) parts.push(dateDisplay);

  const competition = (game?.competition || '').trim();
  const hasIsoDate = (game?.date || '').trim() && /^\d{4}-\d{2}-\d{2}$/.test(game.date);
  if (competition && (!hasIsoDate || competition !== dateDisplay)) {
    parts.push(competition);
  }

  if (game?.result?.trim()) {
    parts.push(`Result: ${game.result.trim()}`);
  }

  parts.push(`${stats?.mins ?? 0} min`);

  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function getGameDateLabel(game) {
  const parts = [];
  if (game.date) parts.push(game.date);
  if (game.competition) parts.push(game.competition);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function sortGamesNewestFirst(games) {
  return [...games].sort((a, b) => {
    const da = a.date || a.createdAt || '';
    const db = b.date || b.createdAt || '';
    return db.localeCompare(da);
  });
}

export function sortGamesOldestFirst(games) {
  return [...games].sort((a, b) => {
    const da = a.date || a.createdAt || '';
    const db = b.date || b.createdAt || '';
    return da.localeCompare(db);
  });
}
