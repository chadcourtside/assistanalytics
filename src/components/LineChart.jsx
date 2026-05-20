export default function LineChart({ series, color = '#2563eb', height = 120 }) {
  if (!series || series.length === 0) {
    return (
      <div className="text-xs text-gray-400 text-center py-8">Not enough games yet</div>
    );
  }

  const values = series.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const padX = 8;
  const padY = 12;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = series.map((d, i) => {
    const x = padX + (series.length === 1 ? chartW / 2 : (i / (series.length - 1)) * chartW);
    const y = padY + chartH - ((d.value - min) / range) * chartH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={polyline}
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill={color} />
          <title>{`${p.label}: ${p.value}`}</title>
        </g>
      ))}
    </svg>
  );
}
