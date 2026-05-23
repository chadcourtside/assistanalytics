import {
  createId,
  createInviteCode,
  hashPassword,
  nowIso,
  signPayload,
  verifyPassword,
  verifySignedPayload,
} from './crypto.js';
import { buildSessionCookie, getSessionToken, sessionExpiryMs, isSecureRequest } from './http.js';

function getSessionSecret(env) {
  return env.SESSION_SECRET || 'dev-only-change-me-in-production';
}

export async function createSessionToken(userId, teamId, role, env) {
  return signPayload(
    {
      userId,
      teamId,
      role,
      exp: sessionExpiryMs(),
    },
    getSessionSecret(env)
  );
}

export async function readSession(request, env) {
  const token = getSessionToken(request);
  if (!token) return null;
  const payload = await verifySignedPayload(token, getSessionSecret(env));
  if (!payload?.userId || !payload?.teamId) return null;
  return payload;
}

export async function requireSession(request, env, { write = false } = {}) {
  const session = await readSession(request, env);
  if (!session) return { error: 'Unauthorized', status: 401 };

  const membership = await env.DB.prepare(
    'SELECT role FROM memberships WHERE user_id = ? AND team_id = ?'
  )
    .bind(session.userId, session.teamId)
    .first();

  if (!membership) return { error: 'Team membership not found', status: 403 };

  const role = membership.role;
  if (write && role === 'viewer') {
    return { error: 'View-only members cannot edit team data', status: 403 };
  }

  return { session: { ...session, role } };
}

export async function signupUser(env, { email, password, teamName }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { error: 'A valid email is required' };
  }
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first();
  if (existing) return { error: 'An account with that email already exists' };

  const userId = createId('user');
  const passwordHash = await hashPassword(password);
  const createdAt = nowIso();

  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
  )
    .bind(userId, normalizedEmail, passwordHash, createdAt)
    .run();

  let team = null;
  if (teamName?.trim()) {
    team = await createTeamForUser(env, userId, teamName.trim());
    if (team.error) return team;
  }

  return {
    user: { id: userId, email: normalizedEmail },
    team,
  };
}

export async function loginUser(env, { email, password }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await env.DB.prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
    .bind(normalizedEmail)
    .first();

  if (!user) return { error: 'Invalid email or password' };

  const valid = await verifyPassword(password || '', user.password_hash);
  if (!valid) return { error: 'Invalid email or password' };

  const membership = await env.DB.prepare(
    `SELECT m.team_id, m.role, t.name, t.invite_code
     FROM memberships m
     JOIN teams t ON t.id = m.team_id
     WHERE m.user_id = ?
     ORDER BY m.joined_at ASC
     LIMIT 1`
  )
    .bind(user.id)
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

export async function createTeamForUser(env, userId, name) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) return { error: 'Team name is required' };

  const teamId = createId('team');
  const inviteCode = createInviteCode();
  const createdAt = nowIso();

  await env.DB.batch([
    env.DB.prepare('INSERT INTO teams (id, name, invite_code, created_at) VALUES (?, ?, ?, ?)').bind(
      teamId,
      trimmedName,
      inviteCode,
      createdAt
    ),
    env.DB.prepare(
      'INSERT INTO memberships (user_id, team_id, role, joined_at) VALUES (?, ?, ?, ?)'
    ).bind(userId, teamId, 'owner', createdAt),
    env.DB.prepare(
      `INSERT INTO team_state (team_id, state_json, schema_version, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(teamId, '{}', 1, createdAt, userId),
  ]);

  return {
    id: teamId,
    name: trimmedName,
    inviteCode,
    role: 'owner',
  };
}

export async function joinTeam(env, userId, inviteCode) {
  const code = (inviteCode || '').trim().toUpperCase();
  if (!code) return { error: 'Invite code is required' };

  const team = await env.DB.prepare('SELECT id, name, invite_code FROM teams WHERE invite_code = ?')
    .bind(code)
    .first();
  if (!team) return { error: 'Invalid invite code' };

  const existing = await env.DB.prepare(
    'SELECT role FROM memberships WHERE user_id = ? AND team_id = ?'
  )
    .bind(userId, team.id)
    .first();

  if (existing) {
    return {
      id: team.id,
      name: team.name,
      inviteCode: team.invite_code,
      role: existing.role,
    };
  }

  const joinedAt = nowIso();
  await env.DB.prepare(
    'INSERT INTO memberships (user_id, team_id, role, joined_at) VALUES (?, ?, ?, ?)'
  )
    .bind(userId, team.id, 'coach', joinedAt)
    .run();

  return {
    id: team.id,
    name: team.name,
    inviteCode: team.invite_code,
    role: 'coach',
  };
}

export function authResponse(request, env, { user, team }) {
  if (!team) {
    return { body: { user, team: null }, cookie: null };
  }

  return createSessionToken(user.id, team.id, team.role, env).then((token) => ({
    body: {
      user,
      team: {
        id: team.id,
        name: team.name,
        inviteCode: team.inviteCode,
        role: team.role,
      },
    },
    cookie: buildSessionCookie(token, isSecureRequest(request)),
  }));
}
