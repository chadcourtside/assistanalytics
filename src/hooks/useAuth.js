import { useState, useCallback } from 'react';
import * as cloudApi from '../api/cloudApi';
import { setLocalOnlyMode } from '../storage/storageAdapter';

export function useAuth() {
  const [auth, setAuth] = useState({
    status: 'loading',
    user: null,
    team: null,
    error: null,
  });

  const applySession = useCallback((data) => {
    setAuth({
      status: data?.team ? 'authed' : 'needs_team',
      user: data?.user ?? null,
      team: data?.team ?? null,
      error: null,
    });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await cloudApi.fetchSession();
      if (data?.team) {
        setLocalOnlyMode(false);
        applySession(data);
        return data;
      }
      if (data?.user) {
        setAuth({
          status: 'needs_team',
          user: data.user,
          team: null,
          error: null,
        });
        return data;
      }
      setAuth({ status: 'unauthed', user: null, team: null, error: null });
      return data;
    } catch (err) {
      if (err.status === 503) {
        setAuth({ status: 'offline_api', user: null, team: null, error: null });
        return null;
      }
      setAuth({ status: 'unauthed', user: null, team: null, error: null });
      return null;
    }
  }, [applySession]);

  const signup = useCallback(async ({ email, password, teamName }) => {
    setAuth((prev) => ({ ...prev, error: null }));
    try {
      const data = await cloudApi.signup({ email, password, teamName });
      setLocalOnlyMode(false);
      applySession(data);
      return { success: true, data };
    } catch (err) {
      const message = err.body?.error || err.message || 'Sign up failed';
      setAuth((prev) => ({ ...prev, error: message }));
      return { success: false, error: message };
    }
  }, [applySession]);

  const login = useCallback(async ({ email, password }) => {
    setAuth((prev) => ({ ...prev, error: null }));
    try {
      const data = await cloudApi.login({ email, password });
      setLocalOnlyMode(false);
      applySession(data);
      return { success: true, data };
    } catch (err) {
      const message = err.body?.error || err.message || 'Login failed';
      setAuth((prev) => ({ ...prev, error: message }));
      return { success: false, error: message };
    }
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      await cloudApi.logout();
    } catch {
      // ignore logout errors
    }
    setAuth({ status: 'unauthed', user: null, team: null, error: null });
  }, []);

  const createTeam = useCallback(async ({ name }) => {
    setAuth((prev) => ({ ...prev, error: null }));
    try {
      const data = await cloudApi.createTeam({ name });
      applySession(data);
      return { success: true, data };
    } catch (err) {
      const message = err.body?.error || err.message || 'Could not create team';
      setAuth((prev) => ({ ...prev, error: message }));
      return { success: false, error: message };
    }
  }, [applySession]);

  const joinTeam = useCallback(async ({ inviteCode, role }) => {
    setAuth((prev) => ({ ...prev, error: null }));
    try {
      const data = await cloudApi.joinTeam({ inviteCode, role });
      applySession(data);
      return { success: true, data };
    } catch (err) {
      const message = err.body?.error || err.message || 'Could not join team';
      setAuth((prev) => ({ ...prev, error: message }));
      return { success: false, error: message };
    }
  }, [applySession]);

  const useLocalMode = useCallback(() => {
    setLocalOnlyMode(true);
    setAuth({ status: 'local', user: null, team: null, error: null });
  }, []);

  const requestMagicLink = useCallback(async ({ email }) => {
    try {
      const data = await cloudApi.requestMagicLink({ email });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.body?.error || err.message || 'Could not send link' };
    }
  }, []);

  const requestPasswordReset = useCallback(async ({ email }) => {
    try {
      const data = await cloudApi.requestPasswordReset({ email });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.body?.error || err.message || 'Could not send reset email' };
    }
  }, []);

  const resetPassword = useCallback(async ({ token, password }) => {
    try {
      const data = await cloudApi.resetPassword({ token, password });
      setLocalOnlyMode(false);
      applySession(data);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.body?.error || err.message || 'Could not reset password' };
    }
  }, [applySession]);

  const consumeAuthToken = useCallback(async (token) => {
    try {
      const data = await cloudApi.consumeAuthToken({ token });
      setLocalOnlyMode(false);
      applySession(data);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.body?.error || err.message || 'Invalid or expired link' };
    }
  }, [applySession]);

  return {
    auth,
    refreshSession,
    signup,
    login,
    logout,
    createTeam,
    joinTeam,
    useLocalMode,
    requestMagicLink,
    requestPasswordReset,
    resetPassword,
    consumeAuthToken,
  };
}
