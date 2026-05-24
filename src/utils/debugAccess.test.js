import { describe, it, expect } from 'vitest';
import { applyDebugView, getDebugAdminEmails, isDebugAdmin } from './debugAccess.js';

describe('debugAccess', () => {
  const authed = {
    status: 'authed',
    user: { id: 'u1', email: 'chad.courtside@gmail.com' },
    team: { id: 't1', name: 'Gold', role: 'coach', inviteCode: 'ABC' },
    error: null,
  };

  it('recognizes configured admin emails', () => {
    expect(getDebugAdminEmails()).toContain('chad.courtside@gmail.com');
    expect(isDebugAdmin({ email: 'Chad.Courtside@gmail.com' })).toBe(true);
    expect(isDebugAdmin({ email: 'other@example.com' })).toBe(false);
  });

  it('overrides team role for owner/coach/viewer previews', () => {
    expect(applyDebugView(authed, 'owner').team.role).toBe('owner');
    expect(applyDebugView(authed, 'coach').team.role).toBe('coach');
    expect(applyDebugView(authed, 'viewer').team.role).toBe('viewer');
    expect(applyDebugView(authed, 'viewer').debugPreview).toBe('viewer');
  });

  it('simulates local and auth gate states', () => {
    expect(applyDebugView(authed, 'local').status).toBe('local');
    expect(applyDebugView(authed, 'unauthed').status).toBe('unauthed');
    expect(applyDebugView(authed, 'needs_team').status).toBe('needs_team');
    expect(applyDebugView(authed, 'needs_team').user.email).toBe('chad.courtside@gmail.com');
  });
});
