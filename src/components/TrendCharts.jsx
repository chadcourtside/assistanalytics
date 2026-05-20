import LineChart from './LineChart';
import { buildTrendSeries, TREND_METRICS } from '../utils/gameTrends';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];

export default function TrendCharts({ games }) {
  if (games.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-bold text-gray-800 mb-1">Season Trends</h3>
        <p className="text-sm text-gray-500">Log at least 2 games to see trend charts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
        <h3 className="font-bold text-slate-800">Season Trends</h3>
        <p className="text-xs text-gray-500 mt-0.5">Per-game values, oldest → newest (left to right)</p>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {TREND_METRICS.map((metric, i) => {
          const series = buildTrendSeries(games, metric.key);
          const latest = series[series.length - 1]?.value ?? 0;
          return (
            <div key={metric.key} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">{metric.label}</span>
                <span className="text-sm font-bold text-gray-800">{metric.format(latest)}</span>
              </div>
              <LineChart series={series} color={COLORS[i % COLORS.length]} />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                <span>{series[0]?.label}</span>
                <span>{series[series.length - 1]?.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
