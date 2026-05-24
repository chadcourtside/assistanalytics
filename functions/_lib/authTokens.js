import { createInviteCode, hashPassword, nowIso } from './crypto.js';

const LOGIN_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function createTokenString() {
  return `${createInviteCode()}${createInviteCode()}`;
}

function expiryIso(ms) {
  return new Date(Date.now() + ms).toISOString();
}

export async function createAuthToken(env, userId, purpose) {
  const token = createTokenString();
  const ttl = purpose === 'reset_password' ? RESET_TTL_MS : LOGIN_TTL_MS;
  const expiresAt = expiryIso(ttl);
  const createdAt = nowIso();

  await env.DB.prepare('DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?')
    .bind(userId, purpose)
    .run();

  await env.DB.prepare(
    'INSERT INTO auth_tokens (token, user_id, purpose, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(token, userId, purpose, expiresAt, createdAt)
    .run();

  return { token, expiresAt };
}

export async function resolveAuthToken(env, token) {
  const normalized = (token || '').trim().toUpperCase();
  if (!normalized) return { error: 'Token is required' };

  const row = await env.DB.prepare(
    'SELECT token, user_id, purpose, expires_at FROM auth_tokens WHERE token = ?'
  )
    .bind(normalized)
    .first();

  if (!row) return { error: 'Invalid or expired link', status: 404 };
  if (Date.now() > Date.parse(row.expires_at)) {
    await env.DB.prepare('DELETE FROM auth_tokens WHERE token = ?').bind(normalized).run();
    return { error: 'Link has expired', status: 410 };
  }

  return {
    token: row.token,
    userId: row.user_id,
    purpose: row.purpose,
  };
}

export async function consumeAuthToken(env, token) {
  const resolved = await resolveAuthToken(env, token);
  if (resolved.error) return resolved;

  await env.DB.prepare('DELETE FROM auth_tokens WHERE token = ?').bind(resolved.token).run();
  return resolved;
}

export async function resetPasswordWithToken(env, token, password) {
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const resolved = await consumeAuthToken(env, token);
  if (resolved.error) return resolved;
  if (resolved.purpose !== 'reset_password') {
    return { error: 'Invalid reset link', status: 400 };
  }

  const passwordHash = await hashPassword(password);
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(passwordHash, resolved.userId)
    .run();

  return { userId: resolved.userId };
}

export async function getUserAuthProfile(env, userId) {
  const user = await env.DB.prepare('SELECT id, email FROM users WHERE id = ?').bind(userId).first();
  if (!user) return { error: 'User not found', status: 404 };

  const membership = await env.DB.prepare(
    `SELECT m.team_id, m.role, t.name, t.invite_code
     FROM memberships m
     JOIN teams t ON t.id = m.team_id
     WHERE m.user_id = ?
     ORDER BY m.joined_at ASC
     LIMIT 1`
  )
    .bind(userId)
    .first();

  return {
    user: { id: user.id, email: user.email },
    team: membership
      ? {
          id: membership.team_id,
          name: membership.name,
          inviteCode: membership.invite_code,
          role: membership.role,
        }
      : null,
  };
}
