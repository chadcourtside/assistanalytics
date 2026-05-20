import { normalizeGameStats } from './gameStats';
import { playEventsFromPlayByPlay } from './playEvents';

export const STAT_FIELDS = [
  { key: 'mins', label: 'MIN' },
  { key: 'pts', label: 'PTS' },
  { key: 'fgm', label: 'FGM' },
  { key: 'fga', label: 'FGA' },
  { key: 'threePm', label: '3PM' },
  { key: 'threePa', label: '3PA' },
  { key: 'oreb', label: 'OREB' },
  { key: 'dreb', label: 'DREB' },
  { key: 'reb', label: 'REB' },
  { key: 'blk', label: 'BLK' },
  { key: 'ast', label: 'AST' },
  { key: 'hqpa', label: 'HQPA' },
  { key: 'tov', label: 'TOV' },
  { key: 'liveBallTov', label: 'LB TOV' },
  { key: 'stl', label: 'STL' },
  { key: 'defl', label: 'DEFL' },
  { key: 'pf', label: 'PF' },
  { key: 'foulsDrawn', label: 'FD' },
  { key: 'ptch', label: 'PTCH' },
  { key: 'plusMinus', label: '+/-' },
];

export function createEmptyStats() {
  return normalizeGameStats({});
}

export function parsePlayByPlayText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function playByPlayToText(playByPlay) {
  if (!playByPlay || !playByPlay.length) return '';
  return playByPlay.join('\n');
}

export function gameToFormState(game) {
  if (!game) {
    return {
      date: new Date().toISOString().slice(0, 10),
      opponent: '',
      result: '',
      competition: '',
      videoUrl: '',
      stats: createEmptyStats(),
      playByPlayText: '',
    };
  }
  const stats = normalizeGameStats(game.stats);
  return {
    date: game.date || '',
    opponent: game.opponent || '',
    result: game.result || '',
    competition: game.competition || '',
    videoUrl: game.videoUrl || '',
    stats,
    playByPlayText: playByPlayToText(game.playByPlay),
  };
}

export function parseStatValue(value) {
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? 0 : Math.max(0, n);
}

export function validateGameForm(form) {
  const errors = {};
  if (!form.opponent?.trim()) {
    errors.opponent = 'Opponent is required';
  }
  const stats = normalizeGameStats(
    Object.fromEntries(
      STAT_FIELDS.map(({ key }) => [key, parseStatValue(form.stats?.[key])])
    )
  );
  if (stats.fgm > stats.fga) {
    errors.stats = 'FGM cannot exceed FGA';
  }
  if (stats.threePm > stats.threePa) {
    errors.stats = '3PM cannot exceed 3PA';
  }
  if (stats.threePm > stats.fgm) {
    errors.stats = '3PM cannot exceed FGM';
  }
  return { errors, stats };
}

export function buildGamePayload(form, stats) {
  const playByPlay = parsePlayByPlayText(form.playByPlayText);
  return {
    date: form.date?.trim() || '',
    opponent: form.opponent.trim(),
    result: form.result?.trim() || undefined,
    competition: form.competition?.trim() || undefined,
    videoUrl: form.videoUrl?.trim() || '',
    stats,
    playByPlay,
    playEvents: playEventsFromPlayByPlay(playByPlay),
  };
}
