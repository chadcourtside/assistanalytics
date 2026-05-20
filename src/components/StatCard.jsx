import StatHelp from './StatHelp';

export default function StatCard({ label, statId, value, sub, bold = false }) {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
      <span className="text-xs text-gray-500 uppercase tracking-wide">
        {statId ? <StatHelp statId={statId}>{label}</StatHelp> : label}
      </span>
      <span
        className={`text-xl ${bold ? 'font-black text-blue-700' : 'font-bold text-gray-800'} mt-1`}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-gray-400 mt-1">{sub}</span>}
    </div>
  );
}
