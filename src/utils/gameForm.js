import { normalizeGameStats } from './gameStats';
import { playEventsFromPlayByPlay } from './playEvents';

import { normalizeGameType, GAME_TYPES } from '../constants/gameTypes';

export const STAT_FIELDS = [
  { key: 'mins', label: 'MIN' },
  { key: 'pts', label: 'PTS' },
  { key: 'fgm', label: 'FGM' },
  { key: 'fga', label: 'FGA' },
  { key: 'threePm', label: '3PM' },
  { key: 'threePa', label: '3PA' },
  { key: 'ftm', label: 'FTM' },
  { key: 'fta', label: 'FTA' },
  { key: 'oreb', label: 'OREB' },
  { key: 'dreb', label: 'DREB' },
  { key: 'reb', label: 'REB' },
  { key: 'blk', label: 'BLK' },
  { key: 'ast', label: 'AST' },
  { key: 'hqpa', label: 'HQPA' },
  { key: 'secondAst', label: '2ND AST' },
  { key: 'screenAst', label: 'SCR AST' },
  { key: 'tov', label: 'TOV' },
  { key: 'liveBallTov', label: 'LB TOV' },
  { key: 'stl', label: 'STL' },
  { key: 'defl', label: 'DEFL' },
  { key: 'pf', label: 'PF' },
  { key: 'foulsDrawn', label: 'FD' },
  { key: 'ptch', label: 'PTCH' },
  { key: 'plusMinus', label: '+/-' },
];

/** Subset shown in quick-log mode (sideline / post-game speed entry). */
export const QUICK_STAT_FIELDS = [
  { key: 'mins', label: 'MIN' },
  { key: 'pts', label: 'PTS' },
  { key: 'fgm', label: 'FGM' },
  { key: 'fga', label: 'FGA' },
  { key: 'threePm', label: '3PM' },
  { key: 'threePa', label: '3PA' },
  { key: 'ftm', label: 'FTM' },
  { key: 'fta', label: 'FTA' },
  { key: 'reb', label: 'REB' },
  { key: 'ast', label: 'AST' },
  { key: 'ptch', label: 'PTCH' },
  { key: 'tov', label: 'TOV' },
  { key: 'liveBallTov', label: 'LB TOV' },
  { key: 'plusMinus', label: '+/-' },
];

/** One-tap counters during live tagging. */
export const QUICK_INCREMENT_STATS = [
  { key: 'ptch', label: 'PTCH' },
  { key: 'defl', label: 'DEFL' },
  { key: 'hqpa', label: 'HQPA' },
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

export function gameToFormState(game, { defaultTeam = '', defaultSeason = '' } = {}) {
  if (!game) {
    return {
      date: new Date().toISOString().slice(0, 10),
      opponent: '',
      result: '',
      competition: '',
      team: defaultTeam,
      videoUrl: '',
      gameType: GAME_TYPES.GAME,
      season: defaultSeason,
      stats: createEmptyStats(),
      playByPlayText: '',
      playerTakeaway: '',
    };
  }
  const stats = normalizeGameStats(game.stats);
  return {
    date: game.date || '',
    opponent: game.opponent || '',
    result: game.result || '',
    competition: game.competition || '',
    team: game.team || defaultTeam || '',
    videoUrl: game.videoUrl || '',
    gameType: normalizeGameType(game.gameType),
    season: game.season || defaultSeason || '',
    stats,
    playByPlayText: playByPlayToText(game.playByPlay),
    playerTakeaway: game.playerTakeaway || '',
  };
}

export function duplicateGameFormState(sourceGame, defaults = {}) {
  if (!sourceGame) return gameToFormState(null, defaults);
  const base = gameToFormState(null, defaults);
  return {
    ...base,
    opponent: sourceGame.opponent || '',
    competition: sourceGame.competition || '',
    team: sourceGame.team || defaults.defaultTeam || '',
    gameType: normalizeGameType(sourceGame.gameType),
    season: sourceGame.season || defaults.defaultSeason || '',
    videoUrl: '',
    result: '',
    stats: createEmptyStats(),
    playByPlayText: '',
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
  if (stats.ftm > stats.fta) {
    errors.stats = 'FTM cannot exceed FTA';
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
    team: form.team?.trim() || undefined,
    videoUrl: form.videoUrl?.trim() || '',
    gameType: normalizeGameType(form.gameType),
    season: form.season?.trim() || undefined,
    stats,
    playByPlay,
    playEvents: playEventsFromPlayByPlay(playByPlay),
    playerTakeaway: form.playerTakeaway?.trim() || undefined,
  };
}
