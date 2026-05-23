const VALID_ROLES = ['owner', 'coach', 'viewer'];

export function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

export async function listTeamMembers(env, teamId) {
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.email, m.role, m.joined_at
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.team_id = ?
     ORDER BY m.joined_at ASC`
  )
    .bind(teamId)
    .all();

  return (results ?? []).map((row) => ({
    userId: row.id,
    email: row.email,
    role: row.role,
    joinedAt: row.joined_at,
  }));
}

export async function updateMemberRole(env, { teamId, actorUserId, targetUserId, role }) {
  if (!isValidRole(role)) {
    return { error: 'Invalid role' };
  }

  if (role === 'owner') {
    return { error: 'Use the existing owner account; transfer ownership is not supported yet.' };
  }

  const actor = await env.DB.prepare(
    'SELECT role FROM memberships WHERE user_id = ? AND team_id = ?'
  )
    .bind(actorUserId, teamId)
    .first();

  if (!actor || actor.role !== 'owner') {
    return { error: 'Only the team owner can change member roles', status: 403 };
  }

  const target = await env.DB.prepare(
    'SELECT role FROM memberships WHERE user_id = ? AND team_id = ?'
  )
    .bind(targetUserId, teamId)
    .first();

  if (!target) {
    return { error: 'Member not found on this team', status: 404 };
  }

  if (target.role === 'owner') {
    return { error: 'The owner role cannot be changed' };
  }

  if (targetUserId === actorUserId) {
    return { error: 'You cannot change your own role' };
  }

  await env.DB.prepare(
    'UPDATE memberships SET role = ? WHERE user_id = ? AND team_id = ?'
  )
    .bind(role, targetUserId, teamId)
    .run();

  const member = await env.DB.prepare(
    `SELECT u.id, u.email, m.role, m.joined_at
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.user_id = ? AND m.team_id = ?`
  )
    .bind(targetUserId, teamId)
    .first();

  return {
    member: {
      userId: member.id,
      email: member.email,
      role: member.role,
      joinedAt: member.joined_at,
    },
  };
}

export async function removeTeamMember(env, { teamId, actorUserId, targetUserId }) {
  const actor = await env.DB.prepare(
    'SELECT role FROM memberships WHERE user_id = ? AND team_id = ?'
  )
    .bind(actorUserId, teamId)
    .first();

  if (!actor || actor.role !== 'owner') {
    return { error: 'Only the team owner can remove members', status: 403 };
  }

  if (targetUserId === actorUserId) {
    return { error: 'You cannot remove yourself from the team' };
  }

  const target = await env.DB.prepare(
    'SELECT role FROM memberships WHERE user_id = ? AND team_id = ?'
  )
    .bind(targetUserId, teamId)
    .first();

  if (!target) {
    return { error: 'Member not found on this team', status: 404 };
  }

  if (target.role === 'owner') {
    return { error: 'The team owner cannot be removed' };
  }

  await env.DB.prepare('DELETE FROM memberships WHERE user_id = ? AND team_id = ?')
    .bind(targetUserId, teamId)
    .run();

  return { ok: true };
}

export const ROLE_ACCESS = {
  owner: {
    label: 'Owner',
    summary: 'Full edit access and team settings',
  },
  coach: {
    label: 'Coach',
    summary: 'Can log games, edit stats, and manage the shared roster',
  },
  viewer: {
    label: 'Viewer',
    summary: 'Read-only — can review dashboards and film, cannot edit',
  },
};
