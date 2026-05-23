import { useState } from 'react';

const inputClass =
  'w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:outline-none';

export default function AuthGate({
  auth,
  onSignup,
  onLogin,
  onCreateTeam,
  onJoinTeam,
  onUseLocal,
}) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const needsTeam = auth.status === 'needs_team';
  const displayError = formError || auth.error;

  const handleSignup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const result = await onSignup({ email, password, teamName });
    if (!result.success) setFormError(result.error);
    setSubmitting(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const result = await onLogin({ email, password });
    if (!result.success) setFormError(result.error);
    setSubmitting(false);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const result = await onCreateTeam({ name: teamName });
    if (!result.success) setFormError(result.error);
    setSubmitting(false);
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const result = await onJoinTeam({ inviteCode });
    if (!result.success) setFormError(result.error);
    setSubmitting(false);
  };

  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-gray-600 font-medium">Loading cloud session…</p>
      </div>
    );
  }

  if (needsTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Join your team</h1>
          <p className="text-sm text-gray-500 mb-6">
            Signed in as <span className="font-semibold">{auth.user?.email}</span>. Create a new
            team or join with an invite code.
          </p>

          {displayError && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm">{displayError}</div>
          )}

          <form onSubmit={handleCreateTeam} className="mb-6 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Create team</h2>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="7th Grade Gold"
              className={inputClass}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60"
            >
              Create team workspace
            </button>
          </form>

          <form onSubmit={handleJoinTeam} className="space-y-3 border-t border-gray-200 pt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Join team</h2>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Invite code"
              className={inputClass}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md border border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold text-sm disabled:opacity-60"
            >
              Join with invite code
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Assist Analytics</h1>
        <p className="text-sm text-gray-500 mb-6">
          Sign in to sync roster data across devices with your coaching staff.
        </p>

        <div className="flex gap-2 mb-4">
          {['login', 'signup'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setMode(tab);
                setFormError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md ${
                mode === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {displayError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 text-sm">{displayError}</div>
        )}

        {mode === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
              required
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (8+ characters)"
              className={inputClass}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name (optional — e.g. 7th Grade Gold)"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60"
            >
              Create account
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
              required
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={inputClass}
              required
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-60"
            >
              Log in
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          <button
            type="button"
            onClick={onUseLocal}
            className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Continue locally without cloud sync
          </button>
          {auth.status === 'offline_api' && (
            <p className="text-xs text-amber-700 text-center">
              Cloud API unavailable — use local mode or try again later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
