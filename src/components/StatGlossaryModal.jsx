import { STANDARD_STATS, CUSTOM_STATS } from '../data/statGlossary';

function GlossarySection({ title, subtitle, stats }) {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mb-3">{subtitle}</p>}
      <div className="space-y-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className={`p-3 rounded-lg border ${stat.category === 'custom' ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <span className="font-bold text-gray-900">{stat.abbrev}</span>
              <span className="text-sm text-gray-600">{stat.name}</span>
              {stat.category === 'custom' && (
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Custom
                </span>
              )}
            </div>
            {stat.formula && (
              <p className="text-sm font-mono text-blue-800 mb-1">{stat.formula}</p>
            )}
            <p className="text-sm text-gray-700">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StatGlossaryModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 no-print"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        role="dialog"
        aria-labelledby="glossary-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 id="glossary-title" className="text-xl font-bold text-gray-800">
              Stat Glossary
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Hover dotted labels throughout the app for quick definitions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <GlossarySection
            title="Standard stats"
            subtitle="Common basketball metrics with standard formulas in this app."
            stats={STANDARD_STATS}
          />
          <GlossarySection
            title="Custom development stats"
            subtitle="Tracked for player development in Assist Analytics. Log consistently game to game."
            stats={CUSTOM_STATS}
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
