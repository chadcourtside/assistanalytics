import { useCallback, useEffect, useState } from 'react';
import {
  fetchTeamMembers,
  removeTeamMember as removeTeamMemberApi,
  updateMemberRole as updateMemberRoleApi,
} from '../api/cloudApi';

export function useTeamMembers(enabled) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMembers = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamMembers();
      setMembers(data.members ?? []);
    } catch (err) {
      setError(err.body?.error || err.message || 'Could not load team members');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const updateMemberRole = useCallback(async (userId, role) => {
    setError(null);
    try {
      const data = await updateMemberRoleApi({ userId, role });
      setMembers((prev) =>
        prev.map((member) => (member.userId === userId ? data.member : member))
      );
      return { success: true, member: data.member };
    } catch (err) {
      const message = err.body?.error || err.message || 'Could not update role';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const removeMember = useCallback(async (userId) => {
    setError(null);
    try {
      await removeTeamMemberApi({ userId });
      setMembers((prev) => prev.filter((member) => member.userId !== userId));
      return { success: true };
    } catch (err) {
      const message = err.body?.error || err.message || 'Could not remove member';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return { members, loading, error, reload: loadMembers, updateMemberRole, removeMember };
}
