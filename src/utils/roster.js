import { formatGameTitle, formatGameDateDisplay, sortGamesNewestFirst } from './gameStats';
import {
  sumGameStats,
  seasonAverages,
  getBenchmarkMetricValue,
  getBenchmarkStatusColor,
} from './stats';

export const NO_TEAM_LABEL = 'No Team';

export function getPlayerTeamLabel(player) {
  const team = (player?.team || '').trim();
  return team || NO_TEAM_LABEL;
}

export function getTeamList(players) {
  const teams = new Set();
  for (const p of players) {
    teams.add(getPlayerTeamLabel(p));
  }
  return [...teams].sort((a, b) => {
    if (a === NO_TEAM_LABEL) return 1;
    if (b === NO_TEAM_LABEL) return -1;
    return a.localeCompare(b);
  });
}

export function groupPlayersByTeam(players, teamFilter = 'all') {
  const filtered =
    teamFilter === 'all'
      ? players
      : players.filter((p) => getPlayerTeamLabel(p) === teamFilter);

  const map = new Map();
  for (const player of filtered) {
    const label = getPlayerTeamLabel(player);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(player);
  }

  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === NO_TEAM_LABEL) return 1;
      if (b === NO_TEAM_LABEL) return -1;
      return a.localeCompare(b);
    })
    .map(([team, rosterPlayers]) => ({
      team,
      players: rosterPlayers.sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      ),
    }));
}

export function countKeyBenchmarksOnTrack(benchmarkSet, averages) {
  const keyTargets = (benchmarkSet?.targets ?? []).filter((t) => t.isKey);
  let onTrack = 0;

  for (const t of keyTargets) {
    const val = getBenchmarkMetricValue(t.metricKey, averages);
    const color = getBenchmarkStatusColor(
      val,
      t.target12,
      t.isLowerBetter,
      t.metricKey
    );
    if (color.includes('green')) onTrack += 1;
  }

  return { onTrack, total: keyTargets.length };
}

export function buildPlayerRosterSummary(player, games, benchmarkSet) {
  const playerGames = games.filter((g) => g.playerId === player.id);
  const gameCount = playerGames.length;
  const totals = sumGameStats(playerGames);
  const averages = seasonAverages(totals, gameCount || 1);
  const lastGame = sortGamesNewestFirst(playerGames)[0] ?? null;
  const benchmarks = countKeyBenchmarksOnTrack(benchmarkSet, averages);

  return {
    gameCount,
    averages,
    lastGame,
    lastGameLabel: lastGame
      ? `${formatGameTitle(lastGame, player)}${formatGameDateDisplay(lastGame) ? ` · ${formatGameDateDisplay(lastGame)}` : ''}`
      : 'No games yet',
    benchmarks,
  };
}
