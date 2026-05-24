/** Normalize team labels from stored player data (supports legacy `team` string). */
export function getPlayerTeams(player) {
  if (Array.isArray(player?.teams)) {
    const normalized = player.teams.map((t) => String(t).trim()).filter(Boolean);
    return [...new Set(normalized)];
  }

  const legacy = (player?.team || '').trim();
  return legacy ? [legacy] : [];
}

export function getPrimaryTeamLabel(player) {
  return getPlayerTeams(player)[0] ?? null;
}

export function normalizeTeamList(teams) {
  if (!Array.isArray(teams)) return [];
  return [...new Set(teams.map((t) => String(t).trim()).filter(Boolean))];
}

export function playersShareTeam(playerA, playerB) {
  const aTeams = new Set(getPlayerTeams(playerA));
  return getPlayerTeams(playerB).some((label) => aTeams.has(label));
}

export function getSharedTeamLabels(playerA, playerB) {
  const bTeams = new Set(getPlayerTeams(playerB));
  return getPlayerTeams(playerA).filter((label) => bTeams.has(label));
}

export function formatTeamLabels(teams) {
  const labels = normalizeTeamList(teams);
  if (labels.length === 0) return '';
  return labels.join(' · ');
}
