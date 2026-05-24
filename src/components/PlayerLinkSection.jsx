import { useEffect, useState } from 'react';
import {
  createPlayerLink,
  fetchPlayerLink,
  revokePlayerLink,
} from '../api/playerPortalApi';
import { buildPlayerPortalUrl } from '../utils/playerPortal';

export default function PlayerLinkSection({ player, cloudEnabled }) {
  const [linkUrl, setLinkUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cloudEnabled || !player?.id) {
      setLinkUrl('');
      setStatus('unavailable');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    fetchPlayerLink(player.id)
      .then((data) => {
        if (cancelled) return;
        if (data?.link?.token) {
          setLinkUrl(buildPlayerPortalUrl(data.link.token));
          setStatus('ready');
        } else {
          setLinkUrl('');
          setStatus('none');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLinkUrl('');
          setStatus('none');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cloudEnabled, player?.id]);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied to clipboard.');
    } catch {
      setMessage('Copy failed — select the link and copy manually.');
    }
  };

  const handleCreate = async () => {
    setBusy(true);
    setMessage('');
    try {
      const data = await createPlayerLink(player.id);
      const url = buildPlayerPortalUrl(data.link.token);
      setLinkUrl(url);
      setStatus('ready');
      await copyText(url);
    } catch (err) {
      setMessage(err.message || 'Could not create player link.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!linkUrl) return;
    await copyText(linkUrl);
  };

  const handleRevoke = async () => {
    if (!window.confirm('Revoke this player link? The athlete will lose access until you create a new link.')) {
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await revokePlayerLink(player.id);
      setLinkUrl('');
      setStatus('none');
      setMessage('Player link revoked.');
    } catch (err) {
      setMessage(err.message || 'Could not revoke player link.');
    } finally {
      setBusy(false);
    }
  };

  if (!cloudEnabled) {
    return (
      <div className="border-t border-gray-200 pt-4 mt-2">
        <h3 className="text-sm font-bold text-gray-700 mb-1">Player portal link</h3>
        <p className="text-xs text-gray-500">
          Sign in with cloud sync to generate a read-only link for this athlete.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-2 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-gray-700">Player portal link</h3>
        <p className="text-xs text-gray-500 mt-1">
          Share with {player.displayName} for full read access to their stats, trends, and film.
          Teammates on the same team labels show box scores only — no film or tags.
        </p>
      </div>

      {status === 'loading' && <p className="text-xs text-gray-400">Checking for existing link…</p>}

      {linkUrl && (
        <div className="space-y-2">
          <input
            type="text"
            readOnly
            value={linkUrl}
            className="w-full text-xs px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
            onFocus={(e) => e.target.select()}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleCopy}
              className="text-sm bg-slate-100 hover:bg-slate-200 text-gray-800 px-3 py-1.5 rounded-md font-semibold disabled:opacity-50"
            >
              Copy link
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleCreate}
              className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md font-semibold disabled:opacity-50"
            >
              Regenerate
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleRevoke}
              className="text-sm bg-red-50 hover:bg-red-100 text-red-800 px-3 py-1.5 rounded-md font-semibold disabled:opacity-50"
            >
              Revoke
            </button>
          </div>
        </div>
      )}

      {!linkUrl && status !== 'loading' && (
        <button
          type="button"
          disabled={busy}
          onClick={handleCreate}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-semibold text-sm disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create player link'}
        </button>
      )}

      {message && <p className="text-xs text-gray-600">{message}</p>}
    </div>
  );
}
