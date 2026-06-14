export interface ChartPoint { label: string; value: number }

/** กราฟพื้นที่ (area) แบบเบา ๆ — ความก้าวหน้าสะสมตามเวลา */
export default function ProgressChart({ points }: { points: ChartPoint[] }) {
  const W = 720, H = 200, padX = 14, padT = 16, padB = 30;
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.value));
  const x = (i: number) => padX + (i * (W - padX * 2)) / (n - 1 || 1);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - padB} L${x(0).toFixed(1)},${H - padB} Z`;
  const last = points[n - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="กราฟความก้าวหน้าสะสมตามเวลา">
      <defs>
        <linearGradient id="pcArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* baseline */}
      <line x1={padX} y1={H - padB} x2={W - padX} y2={H - padB} stroke="rgba(255,255,255,.12)" strokeWidth="1" />
      <path d={area} fill="url(#pcArea)" />
      <path d={line} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r={i === n - 1 ? 4.5 : 3} fill={i === n - 1 ? "#e879f9" : "#a78bfa"} />
          <text x={x(i)} y={H - padB + 16} textAnchor="middle" fontSize="11" fill="rgba(203,213,225,.7)">{p.label}</text>
        </g>
      ))}
      {/* last value bubble */}
      {last && (
        <text x={x(n - 1)} y={Math.max(y(last.value) - 10, 14)} textAnchor="middle" fontSize="13" fontWeight="700" fill="#f0abfc">{last.value.toLocaleString()}</text>
      )}
    </svg>
  );
}
