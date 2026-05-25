export default function AnomalyHints({ anomalies, compact = false }) {
  if (!anomalies?.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-2'}`}>
      {anomalies.map((a) => {
        const positive =
          (a.direction === 'high' && a.higherIsBetter) ||
          (a.direction === 'low' && !a.higherIsBetter);
        const negative =
          (a.direction === 'high' && !a.higherIsBetter) ||
          (a.direction === 'low' && a.higherIsBetter);

        const className = positive
          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
          : negative
            ? 'bg-amber-100 text-amber-900 border-amber-200'
            : 'bg-slate-100 text-slate-700 border-slate-200';

        const avgLabel =
          a.key === 'efg'
            ? `${a.average.toFixed(0)}% avg`
            : `${a.average.toFixed(1)} avg`;

        return (
          <span
            key={a.key}
            title={`${a.value} vs ${avgLabel} in this view`}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${className}`}
          >
            {a.message}
          </span>
        );
      })}
    </div>
  );
}

export function anomalyCellClass(key, anomalyMap) {
  const a = anomalyMap?.[key];
  if (!a) return '';
  const positive =
    (a.direction === 'high' && a.higherIsBetter) ||
    (a.direction === 'low' && !a.higherIsBetter);
  if (positive) return 'bg-emerald-50 ring-1 ring-inset ring-emerald-200/80';
  return 'bg-amber-50 ring-1 ring-inset ring-amber-200/80';
}
