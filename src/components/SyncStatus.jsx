export default function SyncStatus({
  auth,
  syncStatus,
  syncError,
  conflictInfo,
  onAcceptCloud,
  onRetry,
  onLogout,
}) {
  if (auth.status === 'local') {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
        <span>Local only</span>
      </div>
    );
  }

  if (auth.status !== 'authed') return null;

  const statusConfig = {
    idle: { label: 'Cloud connected', dot: 'bg-slate-400' },
    syncing: { label: 'Syncing…', dot: 'bg-yellow-400 animate-pulse' },
    saved: { label: 'Saved to cloud', dot: 'bg-green-400' },
    error: { label: syncError || 'Sync error', dot: 'bg-red-400' },
    conflict: { label: 'Sync conflict', dot: 'bg-orange-400' },
    offline: { label: syncError || 'Offline cache', dot: 'bg-amber-400' },
  };

  const current = statusConfig[syncStatus] || statusConfig.idle;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <span className={`inline-block w-2 h-2 rounded-full ${current.dot}`} />
        <span title={auth.team?.name}>{current.label}</span>
        {auth.team?.inviteCode && auth.team?.role === 'owner' && (
          <span
            className="text-slate-400 hidden lg:inline"
            title="Share this invite code with coaches and parents"
          >
            · Invite: {auth.team.inviteCode}
          </span>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="text-slate-400 hover:text-white underline-offset-2 hover:underline"
        >
          Log out
        </button>
      </div>

      {syncStatus === 'conflict' && conflictInfo && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-orange-200">
          <span>Another device saved newer data.</span>
          <button
            type="button"
            onClick={onAcceptCloud}
            className="font-semibold underline hover:text-white"
          >
            Load cloud version
          </button>
        </div>
      )}

      {syncStatus === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          className="text-[11px] text-red-200 hover:text-white underline"
        >
          Retry sync
        </button>
      )}
    </div>
  );
}
