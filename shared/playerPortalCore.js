import {
  getPlayerTeams,
  getSharedTeamLabels,
  playersShareTeam,
} from './playerTeams.js';

function normalizeGameStats(raw = {}) {
  const threePm = raw.threePm ?? raw.tpm ?? 0;
  const threePa = raw.threePa ?? raw.tpa ?? 0;
  const oreb = raw.oreb ?? 0;
  const dreb = raw.dreb ?? 0;
  const reb = raw.reb ?? (oreb > 0 || dreb > 0 ? oreb + dreb : 0);

  return {
    mins: raw.mins ?? 0,
    pts: raw.pts ?? 0,
    fgm: raw.fgm ?? 0,
    fga: raw.fga ?? 0,
    threePm,
    threePa,
    ftm: raw.ftm ?? 0,
    fta: raw.fta ?? 0,
    oreb,
    dreb,
    reb,
    ast: raw.ast ?? 0,
    tov: raw.tov ?? 0,
    liveBallTov: raw.liveBallTov ?? raw.lbTov ?? 0,
    stl: raw.stl ?? 0,
    blk: raw.blk ?? 0,
    pf: raw.pf ?? 0,
    foulsDrawn: raw.foulsDrawn ?? raw.fd ?? 0,
    ptch: raw.ptch ?? 0,
    plusMinus: raw.plusMinus ?? 0,
  };
}

function sortGamesNewestFirst(games) {
  return [...games].sort((a, b) => {
    const da = a.date || a.createdAt || '';
    const db = b.date || b.createdAt || '';
    return db.localeCompare(da);
  });
}

/** Box-score-only game shape for teammate visibility. */
export function toBoxScoreGame(game) {
  return {
    id: game.id,
    playerId: game.playerId,
    date: game.date,
    opponent: game.opponent,
    result: game.result,
    competition: game.competition,
    season: game.season,
    gameType: game.gameType,
    stats: normalizeGameStats(game.stats),
  };
}

/** Full read-only game for the linked player. */
export function toPlayerGame(game) {
  return {
    id: game.id,
    playerId: game.playerId,
    date: game.date,
    opponent: game.opponent,
    result: game.result,
    competition: game.competition,
    season: game.season,
    gameType: game.gameType,
    videoUrl: game.videoUrl,
    stats: normalizeGameStats(game.stats),
    playByPlay: game.playByPlay ?? [],
    playEvents: game.playEvents ?? [],
    playerTakeaway: game.playerTakeaway ?? '',
    starredClipIds: game.starredClipIds ?? [],
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}

/**
 * Build a scoped payload for player portal access.
 * - Linked player: full games, benchmarks, film data
 * - Same-team teammates: box score stats only
 * - Other roster teams: excluded
 */
export function buildPlayerPortalPayload(state, playerId) {
  const players = Array.isArray(state.players) ? state.players : [];
  const games = Array.isArray(state.games) ? state.games : [];
  const benchmarkSets = Array.isArray(state.benchmarkSets) ? state.benchmarkSets : [];

  const player = players.find((p) => p.id === playerId);
  if (!player) {
    return { error: 'Player not found in team roster' };
  }

  const teamLabels = getPlayerTeams(player);
  const ownGames = sortGamesNewestFirst(games.filter((g) => g.playerId === playerId)).map(
    toPlayerGame
  );
  const benchmarkSet = benchmarkSets.find((b) => b.playerId === playerId) ?? null;

  const teammates = players
    .filter((p) => p.id !== playerId && playersShareTeam(player, p))
    .map((teammate) => ({
      player: {
        id: teammate.id,
        displayName: teammate.displayName,
        jerseyNumber: teammate.jerseyNumber,
        position: teammate.position,
        teams: getPlayerTeams(teammate),
      },
      sharedTeams: getSharedTeamLabels(player, teammate),
      games: sortGamesNewestFirst(games.filter((g) => g.playerId === teammate.id)).map(
        toBoxScoreGame
      ),
    }));

  return {
    player,
    teamLabels,
    games: ownGames,
    benchmarkSet,
    teammates,
    activePlayerId: playerId,
  };
}
