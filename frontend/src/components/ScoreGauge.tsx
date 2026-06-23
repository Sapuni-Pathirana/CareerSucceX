import { useEffect, useId, useRef, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
  theme?: 'light' | 'dark';
  variant?: 'default' | 'hero';
}

function scoreColor(value: number, variant: 'default' | 'hero') {
  if (value >= 75) return variant === 'hero' ? '#00B1B1' : '#008080';
  if (value >= 50) return '#008080';
  if (value >= 25) return variant === 'hero' ? '#114852' : '#0B262B';
  return '#5a8885';
}

export default function ScoreGauge({
  score,
  label,
  size = 160,
  theme = 'light',
  variant = 'default',
}: ScoreGaugeProps) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<SVGSVGElement>(null);
  const started = useRef(false);
  const isDark = theme === 'dark';
  const uid = useId().replace(/:/g, '');

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, displayed));
  const offset = circumference - (clamped / 100) * circumference;
  const color = scoreColor(clamped, variant);
  const useGradient = clamped >= 50 && variant === 'default';

  const gradId = `${uid}-grad`;
  const glowId = `${uid}-glow`;
  const softGlowId = `${uid}-soft-glow`;
  const strokeWidth = variant === 'hero' ? 12 : 10;
  const isHero = variant === 'hero';

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
            <stop offset="0%" stopColor="#114852" />
            <stop offset="50%" stopColor="#008080" />
            <stop offset="100%" stopColor="#00B1B1" />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={softGlowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>

        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={isDark ? (isHero ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)') : '#e2e8f0'}
          strokeWidth={strokeWidth}
        />

        {isHero && (
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth + 3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 65 65)"
            filter={`url(#${softGlowId})`}
            opacity={0.35}
          />
        )}

        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke={useGradient ? `url(#${gradId})` : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          filter={isHero ? undefined : `url(#${glowId})`}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />

        <text
          x="65"
          y={variant === 'hero' ? 60 : 62}
          textAnchor="middle"
          fontSize={variant === 'hero' ? 32 : 28}
          fontWeight="800"
          fill={isDark ? '#ffffff' : '#1e1b4b'}
          fontFamily="Inter, sans-serif"
        >
          {Math.round(clamped)}
        </text>
        <text
          x="65"
          y={variant === 'hero' ? 82 : 80}
          textAnchor="middle"
          fontSize={variant === 'hero' ? 12 : 11}
          fill={isDark ? '#7aaea9' : '#94a3b8'}
          fontFamily="Inter, sans-serif"
        >
          / 100
        </text>
      </svg>

      {label && (
        <p className={`text-sm font-semibold tracking-wide ${isDark ? 'text-white/90' : 'text-slate-600'}`}>
          {label}
        </p>
      )}
    </div>
  );
}
