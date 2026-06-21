interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
}

export default function ScoreGauge({ score, label, size = 140 }: ScoreGaugeProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 75 ? '#10b981' : clamped >= 50 ? '#6366f1' : clamped >= 25 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="58" textAnchor="middle" className="fill-slate-900 text-2xl font-bold">
          {Math.round(clamped)}
        </text>
        <text x="60" y="76" textAnchor="middle" className="fill-slate-500 text-xs">
          / 100
        </text>
      </svg>
      {label && <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>}
    </div>
  );
}
