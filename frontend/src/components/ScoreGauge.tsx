import { useEffect, useRef, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
}

export default function ScoreGauge({ score, label, size = 160 }: ScoreGaugeProps) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<SVGSVGElement>(null);
  const started = useRef(false);

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, displayed));
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 75 ? '#10b981' :
    clamped >= 50 ? '#6366f1' :
    clamped >= 25 ? '#f59e0b' : '#ef4444';

  const gradId = `gauge-${label?.replace(/\s/g, '') ?? 'default'}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start: number | null = null;
          const duration = 1200;

          const animate = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplayed(Math.round(eased * score));
            if (p < 1) requestAnimationFrame(animate);
            else setDisplayed(score);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={ref} width={size} height={size} viewBox="0 0 130 130">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#6366f1" />
            <stop offset="50%"  stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />

        {/* Progress */}
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={clamped >= 50 ? `url(#${gradId})` : color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />

        {/* Score */}
        <text
          x="65" y="62"
          textAnchor="middle"
          fontSize="26"
          fontWeight="800"
          fill="#1e1b4b"
          fontFamily="Inter, sans-serif"
        >
          {Math.round(clamped)}
        </text>
        <text
          x="65" y="80"
          textAnchor="middle"
          fontSize="11"
          fill="#94a3b8"
          fontFamily="Inter, sans-serif"
        >
          / 100
        </text>
      </svg>

      {label && (
        <p className="text-sm font-semibold text-slate-600 tracking-wide">{label}</p>
      )}
    </div>
  );
}
