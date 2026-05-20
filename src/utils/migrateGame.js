import { DEFAULT_PLAYER_ID } from '../models/appState';
import { nowIso } from '../models/appState';
import { normalizeGameStats } from './gameStats';

const LEGACY_GAME_IDS = {
  1: 'game-avery-1',
  2: 'game-avery-2',
  3: 'game-avery-3',
};

export function migrateLegacyGame(legacy, playerId = DEFAULT_PLAYER_ID) {
  const ts = nowIso();
  const legacyId = legacy.id;
  const id =
    typeof legacyId === 'string'
      ? legacyId
      : LEGACY_GAME_IDS[legacyId] ?? `game-${playerId}-${legacyId}`;

  const competition =
    legacy.competition ??
    (legacy.date && !/^\d{4}-\d{2}-\d{2}/.test(legacy.date) ? legacy.date : undefined);

  return {
    id,
    playerId: legacy.playerId ?? playerId,
    date: legacy.date && /^\d{4}-\d{2}-\d{2}/.test(legacy.date) ? legacy.date : '',
    opponent: legacy.opponent ?? 'Unknown',
    result: legacy.result,
    team: legacy.team,
    competition,
    videoUrl: legacy.videoUrl ?? '',
    stats: normalizeGameStats(legacy.stats ?? {}),
    playByPlay: legacy.playByPlay ?? [],
    createdAt: legacy.createdAt ?? ts,
    updatedAt: legacy.updatedAt ?? ts,
  };
}
