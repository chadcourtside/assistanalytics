export const TEAM_ROLE_META = {
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

export function formatJoinedDate(iso) {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function buildInviteUrl(inviteCode) {
  if (!inviteCode || typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  url.searchParams.set('join', inviteCode);
  return url.toString();
}

export async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
