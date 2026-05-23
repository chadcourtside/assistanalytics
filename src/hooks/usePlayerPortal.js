import { fetchPlayerPortal } from '../api/playerPortalApi.js';
import {
  clearPlayerTokenFromUrl,
  readPlayerTokenFromUrl,
  writeStoredPlayerToken,
} from '../utils/playerPortal.js';
import { useCallback, useEffect, useState } from 'react';

export function usePlayerPortal(initialToken) {
  const [token, setToken] = useState(() => (initialToken || '').trim());
  const [status, setStatus] = useState('loading');
  const [payload, setPayload] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (nextToken) => {
    const normalized = (nextToken || '').trim();
    if (!normalized) {
      setStatus('error');
      setError('Player link token is missing.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const data = await fetchPlayerPortal(normalized);
      writeStoredPlayerToken(normalized);
      clearPlayerTokenFromUrl();
      setToken(normalized);
      setPayload(data.portal);
      setTeamName(data.teamName || '');
      setStatus('ready');
    } catch (err) {
      writeStoredPlayerToken('');
      setStatus('error');
      setError(err.message || 'Could not load player portal.');
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    const urlToken = readPlayerTokenFromUrl();
    load(urlToken || initialToken);
  }, [initialToken, load]);

  const signOut = useCallback(() => {
    writeStoredPlayerToken('');
    setToken('');
    setPayload(null);
    setStatus('signed_out');
  }, []);

  return {
    token,
    status,
    payload,
    teamName,
    error,
    reload: () => load(token),
    signOut,
  };
}
