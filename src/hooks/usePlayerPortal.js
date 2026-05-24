import { fetchPlayerPortal } from '../api/playerPortalApi.js';
import {
  clearPlayerTokenFromUrl,
  readPlayerTokenFromUrl,
  writeStoredPlayerToken,
} from '../utils/playerPortal.js';
import { useCallback, useEffect, useState } from 'react';

export function usePlayerPortal(initialToken, options = {}) {
  const {
    previewPayload = null,
    previewTeamName = '',
    onExitPreview,
  } = options;
  const isPreview = Boolean(previewPayload);

  const [token, setToken] = useState(() => (isPreview ? '' : (initialToken || '').trim()));
  const [status, setStatus] = useState(() => (isPreview ? 'ready' : 'loading'));
  const [payload, setPayload] = useState(() => previewPayload);
  const [teamName, setTeamName] = useState(() => previewTeamName);
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
    if (isPreview) return;
    const urlToken = readPlayerTokenFromUrl();
    load(urlToken || initialToken);
  }, [initialToken, load, isPreview]);

  const signOut = useCallback(() => {
    if (isPreview) {
      onExitPreview?.();
      return;
    }
    writeStoredPlayerToken('');
    setToken('');
    setPayload(null);
    setStatus('signed_out');
  }, [isPreview, onExitPreview]);

  if (isPreview) {
    return {
      token: '',
      status: 'ready',
      payload: previewPayload,
      teamName: previewTeamName,
      error: '',
      reload: () => {},
      signOut,
      isPreview: true,
    };
  }

  return {
    token,
    status,
    payload,
    teamName,
    error,
    reload: () => load(token),
    signOut,
    isPreview: false,
  };
}
