export function canEditTeamData(auth) {
  if (auth?.status === 'local') return true;
  if (auth?.status !== 'authed') return true;
  return auth.team?.role !== 'viewer';
}

export function isViewer(auth) {
  return auth?.status === 'authed' && auth.team?.role === 'viewer';
}

export function isTeamOwner(auth) {
  return auth?.status === 'authed' && auth.team?.role === 'owner';
}
