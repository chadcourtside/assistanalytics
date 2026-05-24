import { NARRATION_AVOID, NARRATION_TIPS, NARRATION_VOCAB_GROUPS } from '../../shared/narrationVocabulary.js';

export default function NarrationCheatSheetContent({ compact = false }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-sm text-violet-950">
        <p className="font-semibold mb-2">Recording tips</p>
        <ul className="list-disc list-inside space-y-1 text-violet-900">
          {NARRATION_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      {NARRATION_VOCAB_GROUPS.map((group) => (
        <section key={group.label}>
          <h3 className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-base'} mb-2`}>
            {group.label}
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Say this</th>
                  <th className="text-left px-3 py-2 font-semibold">Saves as</th>
                </tr>
              </thead>
              <tbody>
                {group.entries.map((entry) => (
                  <tr key={entry.savesAs + entry.say[0]} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-700 align-top">
                      {entry.say.map((phrase, i) => (
                        <span key={phrase}>
                          {i > 0 && <span className="text-gray-400"> · </span>}
                          <span className="font-medium">&quot;{phrase}&quot;</span>
                        </span>
                      ))}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="font-mono text-xs font-semibold text-violet-800 bg-violet-50 px-1.5 py-0.5 rounded">
                        {entry.savesAs}
                      </span>
                      {entry.hint && (
                        <p className="text-xs text-gray-500 mt-1">{entry.hint}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section>
        <h3 className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-base'} mb-2`}>
          Usually skipped (no tag)
        </h3>
        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          {NARRATION_AVOID.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-gray-800 mb-2">Example narration (~30 seconds)</p>
        <pre className="font-mono text-xs text-gray-700 whitespace-pre-wrap">
          {`paint touch
make two paint touch
assist
make three
live ball turnover
def reb
steal
deflection`}
        </pre>
      </section>
    </div>
  );
}
