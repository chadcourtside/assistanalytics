import { getGameDateLabel, normalizeGameStats } from '../utils/gameStats';
import { calcEFG, calcAstTo } from '../utils/stats';
import { getYoutubeId } from '../utils/youtube';
import StatHelp from './StatHelp';
import AnomalyHints, { anomalyCellClass } from './AnomalyHints';
import { anomaliesByKey } from '../utils/statAnomalies';

export default function LastGamePanel({ game, onOpenFilm, anomalies = [] }) {
  if (!game) return null;

  const stats = normalizeGameStats(game.stats);
  const efg = calcEFG(stats.fgm, stats.threePm, stats.fga);
  const astTo = calcAstTo(stats.ast, stats.tov);
  const hasFilm = Boolean(getYoutubeId(game.videoUrl));
  const clipCount = (game.playEvents?.length ?? game.playByPlay?.length) || 0;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg shadow-sm border border-blue-100 overflow-hidden no-print">
      <div className="px-4 py-3 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Last Game</p>
          <h3 className="text-lg font-bold text-gray-900">
            vs {game.opponent}
            {game.result && <span className="text-gray-500 font-medium ml-2">{game.result}</span>}
          </h3>
          <p className="text-sm text-gray-500">{getGameDateLabel(game)}</p>
          <AnomalyHints anomalies={anomalies} />
        </div>
        <div className="flex gap-2">
          {hasFilm && onOpenFilm && (
            <button
              type="button"
              onClick={() => onOpenFilm(game)}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-semibold"
            >
              Open Film ({clipCount} clips)
            </button>
          )}
        </div>
      </div>
      <div className="px-4 py-3 grid grid-cols-4 sm:grid-cols-8 gap-3 text-center">
        <div>
          {statCell('pts', stats.pts, 'text-lg font-bold text-gray-900')}
          <div className="text-xs text-gray-500"><StatHelp statId="pts">PTS</StatHelp></div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{stats.mins}</div>
          <div className="text-xs text-gray-500"><StatHelp statId="mins">MIN</StatHelp></div>
        </div>
        <div>
          {statCell('ast', stats.ast, 'text-lg font-bold text-gray-900')}
          <div className="text-xs text-gray-500"><StatHelp statId="ast">AST</StatHelp></div>
        </div>
        <div>
          {statCell('ptch', stats.ptch, 'text-lg font-bold text-gray-900')}
          <div className="text-xs text-gray-500"><StatHelp statId="ptch">PTCH</StatHelp></div>
        </div>
        <div>
          {statCell('efg', efg === null ? '—' : `${efg}%`, 'text-lg font-bold text-blue-700')}
          <div className="text-xs text-gray-500"><StatHelp statId="efg">eFG%</StatHelp></div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{astTo}</div>
          <div className="text-xs text-gray-500"><StatHelp statId="astTo">A/TO</StatHelp></div>
        </div>
        <div>
          {statCell(
            'plusMinus',
            `${stats.plusMinus > 0 ? '+' : ''}${stats.plusMinus}`,
            `text-lg font-bold ${stats.plusMinus > 0 ? 'text-green-600' : stats.plusMinus < 0 ? 'text-red-600' : 'text-gray-900'}`
          )}
          <div className="text-xs text-gray-500"><StatHelp statId="plusMinus">+/-</StatHelp></div>
        </div>
        <div>
          {statCell('tov', stats.tov, 'text-lg font-bold text-gray-900')}
          <div className="text-xs text-gray-500"><StatHelp statId="tov">TOV</StatHelp></div>
        </div>
      </div>
    </div>
  );
}
