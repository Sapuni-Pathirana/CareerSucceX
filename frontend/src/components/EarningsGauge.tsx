type EarningsGaugeProps = {
  value: number;
  label?: string;
};

export default function EarningsGauge({ value, label }: EarningsGaugeProps) {
  const pct = Math.min(100, Math.max(0, value));
  const angle = (pct / 100) * 180;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 120;
  const cy = 118;
  const r = 78;
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r * Math.cos(rad(180 - angle));
  const endY = cy - r * Math.sin(rad(180 - angle));
  const largeArc = angle > 90 ? 1 : 0;

  return (
    <div className="analytics-gauge">
      <svg viewBox="0 0 240 140" className="analytics-gauge__svg" aria-hidden>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#114852"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
          fill="none"
          stroke="#008080"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx + 42 * Math.cos(rad(180 - angle))}
          y2={cy - 42 * Math.sin(rad(180 - angle))}
          stroke="#008080"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill="#008080" />
      </svg>
      {label != null && label !== '' && (
        <p className="analytics-gauge__value">{label}</p>
      )}
    </div>
  );
}
