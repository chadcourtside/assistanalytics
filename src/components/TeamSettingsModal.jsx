import { useMemo, useState } from 'react';
import { useTeamMembers } from '../hooks/useTeamMembers';
import {
  TEAM_ROLE_META,
  buildInviteUrl,
  copyText,
  formatJoinedDate,
} from '../utils/teamSettings';

export default function TeamSettingsModal({ auth, onClose, onMembershipChanged }) {
  const isOwner = auth.team?.role === 'owner';
  const { members, loading, error, updateMemberRole, removeMember } = useTeamMembers(
    Boolean(auth.team?.id)
  );
  const [copyMessage, setCopyMessage] = useState('');
  const [actionError, setActionError] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);
  const [removingUserId, setRemovingUserId] = useState(null);

  const coachInviteUrl = useMemo(
    () => buildInviteUrl(auth.team?.inviteCode, 'coach'),
    [auth.team?.inviteCode]
  );
  const parentInviteUrl = useMemo(
    () => buildInviteUrl(auth.team?.inviteCode, 'viewer'),
    [auth.team?.inviteCode]
  );

  const handleCopy = async (text, label) => {
    const ok = await copyText(text);
    setCopyMessage(ok ? `${label} copied` : `Could not copy ${label.toLowerCase()}`);
    if (ok) {
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setActionError(null);
    setSavingUserId(userId);
    const result = await updateMemberRole(userId, role);
    if (!result.success) {
      setActionError(result.error);
    } else if (userId === auth.user?.id) {
      onMembershipChanged?.();
    }
    setSavingUserId(null);
  };

  const handleRemove = async (member) => {
    const confirmed = window.confirm(
      `Remove ${member.email} from ${auth.team?.name}? They will lose access to this team's roster.`
    );
    if (!confirmed) return;

    setActionError(null);
    setRemovingUserId(member.userId);
    const result = await removeMember(member.userId);
    if (!result.success) {
      setActionError(result.error);
    }
    setRemovingUserId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-labelledby="team-settings-title"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="team-settings-title" className="text-xl font-bold text-gray-900">
              Team settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {auth.team?.name} · everyone on this team shares the same roster data
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-6">
          {isOwner && auth.team?.inviteCode && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
                Invite coaches &amp; parents
              </h3>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">Invite code</div>
                  <div className="font-mono text-lg font-bold tracking-widest text-gray-900">
                    {auth.team.inviteCode}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-blue-100 bg-white p-3">
                    <div className="text-xs font-bold uppercase text-blue-800 mb-2">Coach link</div>
                    <p className="text-xs text-gray-500 mb-2">Can log games and edit stats.</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(coachInviteUrl, 'Coach invite link')}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Copy coach link
                    </button>
                  </div>
                  <div className="rounded-md border border-violet-100 bg-white p-3">
                    <div className="text-xs font-bold uppercase text-violet-800 mb-2">Parent link</div>
                    <p className="text-xs text-gray-500 mb-2">Read-only viewer access.</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(parentInviteUrl, 'Parent invite link')}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-md border border-violet-300 text-violet-800 hover:bg-violet-50"
                    >
                      Copy parent link
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(auth.team.inviteCode, 'Invite code')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Copy code only
                </button>

                {copyMessage && (
                  <p className="text-xs text-green-700 font-medium">{copyMessage}</p>
                )}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
              Access levels
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {Object.entries(TEAM_ROLE_META).map(([role, meta]) => (
                <li key={role}>
                  <span className="font-semibold text-gray-800">{meta.label}</span>
                  <span className="text-gray-500"> — {meta.summary}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-2">
              Team members
            </h3>

            {(error || actionError) && (
              <div className="mb-3 p-3 rounded-md bg-red-50 text-red-800 text-sm">
                {actionError || error}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-gray-500">Loading members…</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Email</th>
                      <th className="px-3 py-2 font-semibold">Role</th>
                      <th className="px-3 py-2 font-semibold">Joined</th>
                      <th className="px-3 py-2 font-semibold">Access</th>
                      {isOwner && <th className="px-3 py-2 font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map((member) => {
                      const isSelf = member.userId === auth.user?.id;
                      const canEditRole = isOwner && member.role !== 'owner' && !isSelf;
                      const canRemove = isOwner && member.role !== 'owner' && !isSelf;

                      return (
                        <tr key={member.userId} className={isSelf ? 'bg-blue-50/40' : undefined}>
                          <td className="px-3 py-2 text-gray-900">
                            {member.email}
                            {isSelf && (
                              <span className="ml-2 text-[10px] font-bold uppercase text-blue-700">
                                You
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {canEditRole ? (
                              <select
                                value={member.role}
                                disabled={savingUserId === member.userId}
                                onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                className="text-sm border border-gray-300 rounded-md px-2 py-1"
                              >
                                <option value="coach">Coach</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            ) : (
                              <span className="font-medium text-gray-800">
                                {TEAM_ROLE_META[member.role]?.label || member.role}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {formatJoinedDate(member.joinedAt)}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {TEAM_ROLE_META[member.role]?.summary || '—'}
                          </td>
                          {isOwner && (
                            <td className="px-3 py-2">
                              {canRemove ? (
                                <button
                                  type="button"
                                  disabled={removingUserId === member.userId}
                                  onClick={() => handleRemove(member)}
                                  className="text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && members.length === 0 && (
              <p className="text-sm text-gray-500">No members found for this team.</p>
            )}
          </section>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
