import { createInviteCode, nowIso } from './crypto.js';

function createPlayerLinkToken() {
  return `${createInviteCode()}${createInviteCode()}`;
}

export async function getPlayerLinkForPlayer(env, teamId, playerId) {
  return env.DB.prepare(
    'SELECT token, created_at FROM player_links WHERE team_id = ? AND player_id = ?'
  )
    .bind(teamId, playerId)
    .first();
}

export async function createOrRotatePlayerLink(env, teamId, playerId) {
  const token = createPlayerLinkToken();
  const createdAt = nowIso();

  await env.DB.prepare('DELETE FROM player_links WHERE team_id = ? AND player_id = ?')
    .bind(teamId, playerId)
    .run();

  await env.DB.prepare(
    'INSERT INTO player_links (token, team_id, player_id, created_at) VALUES (?, ?, ?, ?)'
  )
    .bind(token, teamId, playerId, createdAt)
    .run();

  return { token, createdAt };
}

export async function revokePlayerLink(env, teamId, playerId) {
  await env.DB.prepare('DELETE FROM player_links WHERE team_id = ? AND player_id = ?')
    .bind(teamId, playerId)
    .run();
  return { ok: true };
}

export async function resolvePlayerLinkToken(env, token) {
  const normalized = (token || '').trim().toUpperCase();
  if (!normalized) return { error: 'Player link token is required' };

  const row = await env.DB.prepare(
    `SELECT pl.token, pl.team_id, pl.player_id, pl.created_at, t.name AS team_name
     FROM player_links pl
     JOIN teams t ON t.id = pl.team_id
     WHERE pl.token = ?`
  )
    .bind(normalized)
    .first();

  if (!row) return { error: 'Invalid or expired player link', status: 404 };

  return {
    token: row.token,
    teamId: row.team_id,
    playerId: row.player_id,
    teamName: row.team_name,
    createdAt: row.created_at,
  };
}
