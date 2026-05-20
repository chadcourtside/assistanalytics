/**
 * Normalize game stats to canonical v1 shape (supports legacy keys).
 */
export function normalizeGameStats(raw = {}) {
  const threePm = raw.threePm ?? raw.tpm ?? 0;
  const threePa = raw.threePa ?? raw.tpa ?? 0;
  const reb =
    raw.reb ??
    (raw.oreb != null || raw.dreb != null ? (raw.oreb || 0) + (raw.dreb || 0) : 0);
  const liveBallTov = raw.liveBallTov ?? raw.lbTov ?? 0;

  return {
    mins: raw.mins ?? 0,
    pts: raw.pts ?? 0,
    fgm: raw.fgm ?? 0,
    fga: raw.fga ?? 0,
    threePm,
    threePa,
    reb,
    ast: raw.ast ?? 0,
    hqpa: raw.hqpa ?? 0,
    tov: raw.tov ?? 0,
    liveBallTov,
    stl: raw.stl ?? 0,
    defl: raw.defl ?? 0,
    pf: raw.pf ?? 0,
    ptch: raw.ptch ?? 0,
    plusMinus: raw.plusMinus ?? 0,
  };
}

export function getGameDateLabel(game) {
  if (game.competition) return game.competition;
  if (game.date) return game.date;
  return '—';
}
