import { describe, it, expect } from 'vitest';
import { canEditTeamData, isViewer } from './accessControl.js';

describe('accessControl', () => {
  it('allows edits for local and coach/owner cloud users', () => {
    expect(canEditTeamData({ status: 'local' })).toBe(true);
    expect(canEditTeamData({ status: 'authed', team: { role: 'coach' } })).toBe(true);
    expect(canEditTeamData({ status: 'authed', team: { role: 'owner' } })).toBe(true);
  });

  it('blocks edits for viewers', () => {
    expect(canEditTeamData({ status: 'authed', team: { role: 'viewer' } })).toBe(false);
    expect(isViewer({ status: 'authed', team: { role: 'viewer' } })).toBe(true);
  });
});
