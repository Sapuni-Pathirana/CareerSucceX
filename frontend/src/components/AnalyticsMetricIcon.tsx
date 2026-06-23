type MetricTone = 'orange' | 'teal' | 'pink' | 'blue';

const iconProps = {
  className: 'h-5 w-5 shrink-0',
  fill: 'none' as const,
  stroke: '#ffffff',
  'aria-hidden': true as const,
};

export default function AnalyticsMetricIcon({ tone }: { tone: MetricTone }) {
  const icons = {
    orange: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M8 4h8v16H8zM10 8h4M10 12h4" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    teal: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M7 8l5-3 5 3v8l-5 3-5-3V8Z" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    pink: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M8 9h8M8 13h5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="8" strokeWidth="2" />
      </svg>
    ),
    blue: (
      <svg viewBox="0 0 24 24" {...iconProps}>
        <path d="M9 12.5 11 14.5 15.5 9.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="8" strokeWidth="2" />
      </svg>
    ),
  };

  return <div className={`analytics-kpi__icon analytics-kpi__icon--${tone}`}>{icons[tone]}</div>;
}
