import {
  authResponse,
  createSessionToken,
  createTeamForUser,
  joinTeam,
  loginUser,
  readSession,
  requireSession,
  signupUser,
} from '../_lib/auth.js';
import {
  buildSessionCookie,
  clearSessionCookie,
  errorResponse,
  isSecureRequest,
  jsonResponse,
  optionsResponse,
  readJson,
} from '../_lib/http.js';
import { nowIso } from '../_lib/crypto.js';
import { listTeamMembers, removeTeamMember, updateMemberRole } from '../_lib/teams.js';
import {
  createOrRotatePlayerLink,
  getPlayerLinkForPlayer,
  resolvePlayerLinkToken,
  revokePlayerLink,
} from '../_lib/playerLinks.js';
import { buildPlayerPortalPayload } from '../../shared/playerPortalCore.js';
import { sendEmail, getAppBaseUrl } from '../_lib/email.js';
import {
  consumeAuthToken,
  createAuthToken,
  getUserAuthProfile,
  resetPasswordWithToken,
} from '../_lib/authTokens.js';

function routeKey(method, segments) {
  return `${method}:${segments.join('/')}`;
}

async function handleAuthSignup(request, env) {
  const body = await readJson(request);
  const result = await signupUser(env, body || {});
  if (result.error) return errorResponse(result.error, 400);

  const response = await authResponse(request, env, result);
  const headers = response.cookie ? { 'Set-Cookie': response.cookie } : {};
  return jsonResponse(response.body, 201, headers);
}

async function handleAuthLogin(request, env) {
  const body = await readJson(request);
  const result = await loginUser(env, body || {});
  if (result.error) return errorResponse(result.error, 401);

  const response = await authResponse(request, env, result);
  const headers = response.cookie ? { 'Set-Cookie': response.cookie } : {};
  return jsonResponse(response.body, 200, headers);
}

async function handleAuthLogout(request) {
  return jsonResponse({ ok: true }, 200, {
    'Set-Cookie': clearSessionCookie(isSecureRequest(request)),
  });
}

async function handleAuthMe(request, env) {
  const session = await readSession(request, env);
  if (!session) return jsonResponse({ user: null, team: null });

  const user = await env.DB.prepare('SELECT id, email FROM users WHERE id = ?')
    .bind(session.userId)
    .first();
  if (!user) return jsonResponse({ user: null, team: null });

  const team = await env.DB.prepare(
    `SELECT t.id, t.name, t.invite_code, m.role
     FROM teams t
     JOIN memberships m ON m.team_id = t.id
     WHERE t.id = ? AND m.user_id = ?`
  )
    .bind(session.teamId, session.userId)
    .first();

  if (!team) return jsonResponse({ user: { id: user.id, email: user.email }, team: null });

  return jsonResponse({
    user: { id: user.id, email: user.email },
    team: {
      id: team.id,
      name: team.name,
      inviteCode: team.invite_code,
      role: team.role,
    },
  });
}

async function handleTeamsCreate(request, env) {
  const auth = await requireSession(request, env, { write: true });
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await readJson(request);
  const team = await createTeamForUser(env, auth.session.userId, body?.name);
  if (team.error) return errorResponse(team.error, 400);

  const token = await createSessionToken(auth.session.userId, team.id, env);

  return jsonResponse(
    {
      user: { id: auth.session.userId },
      team: {
        id: team.id,
        name: team.name,
        inviteCode: team.inviteCode,
        role: team.role,
      },
    },
    201,
    { 'Set-Cookie': buildSessionCookie(token, isSecureRequest(request)) }
  );
}

async function handleTeamsJoin(request, env) {
  const auth = await requireSession(request, env);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await readJson(request);
  const team = await joinTeam(env, auth.session.userId, body?.inviteCode, body?.role);
  if (team.error) return errorResponse(team.error, 400);

  const token = await createSessionToken(auth.session.userId, team.id, env);

  return jsonResponse(
    {
      user: { id: auth.session.userId },
      team: {
        id: team.id,
        name: team.name,
        inviteCode: team.inviteCode,
        role: team.role,
      },
    },
    200,
    { 'Set-Cookie': buildSessionCookie(token, isSecureRequest(request)) }
  );
}

async function handleStateGet(request, env) {
  const auth = await requireSession(request, env);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const row = await env.DB.prepare(
    'SELECT state_json, schema_version, updated_at, updated_by FROM team_state WHERE team_id = ?'
  )
    .bind(auth.session.teamId)
    .first();

  if (!row) {
    return jsonResponse({
      state: null,
      updatedAt: null,
      schemaVersion: 1,
    });
  }

  let state = null;
  try {
    state = JSON.parse(row.state_json);
    if (Object.keys(state).length === 0) state = null;
  } catch {
    state = null;
  }

  return jsonResponse({
    state,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    updatedBy: row.updated_by,
  });
}

function validateStatePayload(state) {
  if (!state || typeof state !== 'object') return 'State payload is required';
  if (!Array.isArray(state.players)) return 'Missing players array';
  if (!Array.isArray(state.games)) return 'Missing games array';
  if (!Array.isArray(state.benchmarkSets)) return 'Missing benchmarkSets array';
  return null;
}

async function handleStatePut(request, env) {
  const auth = await requireSession(request, env, { write: true });
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await readJson(request);
  const validationError = validateStatePayload(body?.state);
  if (validationError) return errorResponse(validationError, 400);

  const expectedUpdatedAt =
    request.headers.get('If-Match') || body?.expectedUpdatedAt || null;

  const current = await env.DB.prepare(
    'SELECT updated_at FROM team_state WHERE team_id = ?'
  )
    .bind(auth.session.teamId)
    .first();

  if (
    expectedUpdatedAt &&
    current?.updated_at &&
    expectedUpdatedAt !== current.updated_at
  ) {
    const row = await env.DB.prepare(
      'SELECT state_json, schema_version, updated_at FROM team_state WHERE team_id = ?'
    )
      .bind(auth.session.teamId)
      .first();

    let state = null;
    try {
      state = JSON.parse(row.state_json);
    } catch {
      state = null;
    }

    return jsonResponse(
      {
        error: 'Conflict: cloud data was updated elsewhere',
        updatedAt: row.updated_at,
        state,
        schemaVersion: row.schema_version,
      },
      409
    );
  }

  const updatedAt = nowIso();
  const schemaVersion = body.state.schemaVersion ?? 1;
  const stateJson = JSON.stringify(body.state);

  if (current) {
    await env.DB.prepare(
      `UPDATE team_state
       SET state_json = ?, schema_version = ?, updated_at = ?, updated_by = ?
       WHERE team_id = ?`
    )
      .bind(stateJson, schemaVersion, updatedAt, auth.session.userId, auth.session.teamId)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO team_state (team_id, state_json, schema_version, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(auth.session.teamId, stateJson, schemaVersion, updatedAt, auth.session.userId)
      .run();
  }

  return jsonResponse({ ok: true, updatedAt });
}

async function handleTeamsMembersGet(request, env) {
  const auth = await requireSession(request, env);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const members = await listTeamMembers(env, auth.session.teamId);
  return jsonResponse({ members });
}

async function handleTeamsMembersPatch(request, env) {
  const auth = await requireSession(request, env);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await readJson(request);
  const result = await updateMemberRole(env, {
    teamId: auth.session.teamId,
    actorUserId: auth.session.userId,
    targetUserId: body?.userId,
    role: body?.role,
  });

  if (result.error) {
    return errorResponse(result.error, result.status || 400);
  }

  return jsonResponse({ member: result.member });
}

async function handleTeamsMembersDelete(request, env) {
  const auth = await requireSession(request, env);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await readJson(request);
  const result = await removeTeamMember(env, {
    teamId: auth.session.teamId,
    actorUserId: auth.session.userId,
    targetUserId: body?.userId,
  });

  if (result.error) {
    return errorResponse(result.error, result.status || 400);
  }

  return jsonResponse({ ok: true });
}

async function loadTeamState(env, teamId) {
  const row = await env.DB.prepare('SELECT state_json FROM team_state WHERE team_id = ?')
    .bind(teamId)
    .first();

  if (!row) return { error: 'Team data not found', status: 404 };

  try {
    return { state: JSON.parse(row.state_json) };
  } catch {
    return { error: 'Invalid team data', status: 500 };
  }
}

function findPlayerInState(state, playerId) {
  if (!playerId) return null;
  return (state.players || []).find((p) => p.id === playerId) ?? null;
}

async function handlePlayerPortalGet(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const resolved = await resolvePlayerLinkToken(env, token);
  if (resolved.error) return errorResponse(resolved.error, resolved.status || 400);

  const loaded = await loadTeamState(env, resolved.teamId);
  if (loaded.error) return errorResponse(loaded.error, loaded.status || 500);

  const portal = buildPlayerPortalPayload(loaded.state, resolved.playerId);
  if (portal.error) return errorResponse(portal.error, 404);

  return jsonResponse({
    teamName: resolved.teamName,
    portal,
  });
}

async function handlePlayersLinkGet(request, env) {
  const auth = await requireSession(request, env, { write: true });
  if (auth.error) return errorResponse(auth.error, auth.status);

  const url = new URL(request.url);
  const playerId = url.searchParams.get('playerId');
  if (!playerId) return errorResponse('playerId is required', 400);

  const loaded = await loadTeamState(env, auth.session.teamId);
  if (loaded.error) return errorResponse(loaded.error, loaded.status || 500);
  if (!findPlayerInState(loaded.state, playerId)) {
    return errorResponse('Player not found', 404);
  }

  const link = await getPlayerLinkForPlayer(env, auth.session.teamId, playerId);
  if (!link) return jsonResponse({ link: null });

  return jsonResponse({
    link: {
      token: link.token,
      createdAt: link.created_at,
    },
  });
}

async function handlePlayersLinkPost(request, env) {
  const auth = await requireSession(request, env, { write: true });
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await readJson(request);
  const playerId = body?.playerId;
  if (!playerId) return errorResponse('playerId is required', 400);

  const loaded = await loadTeamState(env, auth.session.teamId);
  if (loaded.error) return errorResponse(loaded.error, loaded.status || 500);
  if (!findPlayerInState(loaded.state, playerId)) {
    return errorResponse('Player not found', 404);
  }

  const link = await createOrRotatePlayerLink(env, auth.session.teamId, playerId);
  return jsonResponse({ link }, 201);
}

async function handlePlayersLinkDelete(request, env) {
  const auth = await requireSession(request, env, { write: true });
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await readJson(request);
  const playerId = body?.playerId;
  if (!playerId) return errorResponse('playerId is required', 400);

  await revokePlayerLink(env, auth.session.teamId, playerId);
  return jsonResponse({ ok: true });
}

const GENERIC_AUTH_MESSAGE = 'If an account exists for that email, we sent a link.';

async function findUserByEmail(env, email) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return null;
  return env.DB.prepare('SELECT id, email FROM users WHERE email = ?').bind(normalized).first();
}

async function handleAuthMagicLink(request, env) {
  const body = await readJson(request);
  const user = await findUserByEmail(env, body?.email);
  if (user) {
    const { token } = await createAuthToken(env, user.id, 'login');
    const baseUrl = getAppBaseUrl(request, env);
    const link = `${baseUrl}/?authToken=${token}`;
    await sendEmail(env, {
      to: user.email,
      subject: 'Your Assist Analytics sign-in link',
      text: `Sign in to Assist Analytics: ${link}\n\nThis link expires in 15 minutes.`,
      html: `<p><a href="${link}">Sign in to Assist Analytics</a></p><p>This link expires in 15 minutes.</p>`,
    });
  }
  return jsonResponse({ ok: true, message: GENERIC_AUTH_MESSAGE });
}

async function handleAuthForgotPassword(request, env) {
  const body = await readJson(request);
  const user = await findUserByEmail(env, body?.email);
  if (user) {
    const { token } = await createAuthToken(env, user.id, 'reset_password');
    const baseUrl = getAppBaseUrl(request, env);
    const link = `${baseUrl}/?resetToken=${token}`;
    await sendEmail(env, {
      to: user.email,
      subject: 'Reset your Assist Analytics password',
      text: `Reset your password: ${link}\n\nThis link expires in 1 hour.`,
      html: `<p><a href="${link}">Reset your password</a></p><p>This link expires in 1 hour.</p>`,
    });
  }
  return jsonResponse({ ok: true, message: GENERIC_AUTH_MESSAGE });
}

async function handleAuthConsume(request, env) {
  const body = await readJson(request);
  const resolved = await consumeAuthToken(env, body?.token);
  if (resolved.error) return errorResponse(resolved.error, resolved.status || 400);
  if (resolved.purpose !== 'login') return errorResponse('Invalid sign-in link', 400);

  const profile = await getUserAuthProfile(env, resolved.userId);
  if (profile.error) return errorResponse(profile.error, profile.status || 500);

  const response = await authResponse(request, env, profile);
  const headers = response.cookie ? { 'Set-Cookie': response.cookie } : {};
  return jsonResponse(response.body, 200, headers);
}

async function handleAuthResetPassword(request, env) {
  const body = await readJson(request);
  const result = await resetPasswordWithToken(env, body?.token, body?.password);
  if (result.error) return errorResponse(result.error, result.status || 400);

  const profile = await getUserAuthProfile(env, result.userId);
  const response = await authResponse(request, env, profile);
  const headers = response.cookie ? { 'Set-Cookie': response.cookie } : {};
  return jsonResponse({ ok: true, ...response.body }, 200, headers);
}

const ROUTES = {
  'POST:auth/signup': handleAuthSignup,
  'POST:auth/login': handleAuthLogin,
  'POST:auth/logout': handleAuthLogout,
  'GET:auth/me': handleAuthMe,
  'POST:auth/magic-link': handleAuthMagicLink,
  'POST:auth/forgot-password': handleAuthForgotPassword,
  'POST:auth/consume': handleAuthConsume,
  'POST:auth/reset-password': handleAuthResetPassword,
  'POST:teams/create': handleTeamsCreate,
  'POST:teams/join': handleTeamsJoin,
  'GET:teams/members': handleTeamsMembersGet,
  'PATCH:teams/members': handleTeamsMembersPatch,
  'DELETE:teams/members': handleTeamsMembersDelete,
  'GET:player/portal': handlePlayerPortalGet,
  'GET:players/link': handlePlayersLinkGet,
  'POST:players/link': handlePlayersLinkPost,
  'DELETE:players/link': handlePlayersLinkDelete,
  'GET:state': handleStateGet,
  'PUT:state': handleStatePut,
};

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (!env.DB) {
    return errorResponse('Cloud database is not configured', 503);
  }

  const segments = params.path || [];
  const key = routeKey(request.method, segments);
  const handler = ROUTES[key];

  if (!handler) {
    return errorResponse('Not found', 404);
  }

  try {
    return await handler(request, env);
  } catch (err) {
    console.error('API error', key, err);
    return errorResponse('Internal server error', 500);
  }
}
