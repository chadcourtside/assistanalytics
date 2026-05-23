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

const ROUTES = {
  'POST:auth/signup': handleAuthSignup,
  'POST:auth/login': handleAuthLogin,
  'POST:auth/logout': handleAuthLogout,
  'GET:auth/me': handleAuthMe,
  'POST:teams/create': handleTeamsCreate,
  'POST:teams/join': handleTeamsJoin,
  'GET:teams/members': handleTeamsMembersGet,
  'PATCH:teams/members': handleTeamsMembersPatch,
  'DELETE:teams/members': handleTeamsMembersDelete,
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
