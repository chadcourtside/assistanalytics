import { describe, it, expect } from 'vitest';
import {
  buildFocusBullets,
  buildPlayerReportData,
  buildPlayerReportFilename,
  getBenchmarkStatusLabel,
  collectStarredClips,
  isClipReviewed,
  countReviewedClips,
} from './playerView.js';
import { makeClipId, parseClipId, isClipStarredForPlayer } from './filmClips.js';

describe('playerView focus', () => {
  const player = { displayName: 'Avery', playerFocus: {}, reviewedClips: {} };
  const benchmarkSet = {
    targets: [
      { metricKey: 'ptch', label: 'Paint Touches', target12: '5+', isKey: true },
      { metricKey: 'liveBallTov', label: 'LB TOV', target12: 'Near Zero', isKey: true, isLowerBetter: true },
    ],
  };

  it('uses coach weekly summary when set', () => {
    const bullets = buildFocusBullets(
      { ...player, playerFocus: { weeklySummary: 'Attack the rim\nMove the ball' } },
      benchmarkSet,
      []
    );
    expect(bullets).toEqual(['Attack the rim', 'Move the ball']);
  });

  it('auto-generates from benchmark gaps', () => {
    const games = [{ stats: { mins: 10, ptch: 1, liveBallTov: 2, tov: 2, ast: 1, hqpa: 0, threePa: 0, fta: 0, fgm: 0, fga: 0 } }];
    const bullets = buildFocusBullets(player, benchmarkSet, games);
    expect(bullets.length).toBeGreaterThan(0);
    expect(bullets.some((b) => /paint/i.test(b))).toBe(true);
  });
});

describe('player report', () => {
  it('builds report payload with focus, clips, and benchmarks', () => {
    const player = {
      displayName: 'Avery',
      team: 'Gold',
      playerFocus: { weeklySummary: 'Work on paint touches' },
      reviewedClips: {},
    };
    const games = [
      {
        id: 'g1',
        opponent: 'Hawks',
        playerTakeaway: 'Great effort',
        stats: { mins: 10, pts: 8, ast: 2, ptch: 4, tov: 1, hqpa: 0, threePa: 0, fta: 0, fgm: 3, fga: 5, threePm: 0 },
        playByPlay: [],
      },
    ];
    const benchmarkSet = {
      targets: [
        { metricKey: 'ptch', label: 'Paint Touches', target12: '5+', isKey: true },
      ],
    };
    const report = buildPlayerReportData({ player, games, benchmarkSet });
    expect(report.playerName).toBe('Avery');
    expect(report.focusBullets).toContain('Work on paint touches');
    expect(report.lastGame?.takeaway).toBe('Great effort');
    expect(report.benchmarkRows.length).toBe(1);
  });

  it('formats report filename', () => {
    expect(buildPlayerReportFilename('Avery Smith')).toBe('Avery_Smith_PlayerReport.pdf');
  });

  it('labels benchmark status', () => {
    expect(getBenchmarkStatusLabel(5, '5+', false, 'ptch')).toBe('On track');
  });
});

describe('starred clips and reviews', () => {
  it('collects starred clips newest game first', () => {
    const games = [
      {
        id: 'g2',
        opponent: 'B',
        videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        playByPlay: ['1:00 Make 2 PT'],
        starredClipIds: [makeClipId('g2', 0)],
      },
      {
        id: 'g1',
        opponent: 'A',
        videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        playByPlay: ['2:00 Assist'],
        starredClipIds: [makeClipId('g1', 0)],
      },
    ];
    const clips = collectStarredClips(games);
    expect(clips).toHaveLength(2);
    expect(clips[0].gameId).toBe('g2');
  });

  it('tracks clip reviews on player', () => {
    const player = { reviewedClips: { 'g1-0': { at: '2025-01-01' } } };
    expect(isClipReviewed(player, 'g1-0')).toBe(true);
    expect(countReviewedClips(player, ['g1-0', 'g1-1'])).toBe(1);
  });
});

describe('filmClips helpers', () => {
  it('parses clip ids', () => {
    expect(parseClipId('game-abc-1')).toEqual({ gameId: 'game-abc', index: 1 });
  });

  it('detects starred clips on game', () => {
    const game = { starredClipIds: ['g1-0'] };
    expect(isClipStarredForPlayer(game, 'g1-0')).toBe(true);
    expect(isClipStarredForPlayer(game, 'g1-1')).toBe(false);
  });
});
