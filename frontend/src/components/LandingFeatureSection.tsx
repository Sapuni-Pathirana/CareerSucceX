import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import LandingSectionTitle, { SectionGradientWord } from './LandingSectionTitle';

export type FeatureCard = {
  badge: string;
  headline: string;
  footer: string;
  actionLabel: string;
  actionTo: string;
};

function BadgeIcon() {
  return (
    <span
      className="h-[9px] w-[9px] shrink-0 rounded-full border border-[#008080]"
      aria-hidden
    />
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-2 w-2" fill="none" aria-hidden>
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ARC_COUNT = 6;
const ARC_CX = 600;
const ARC_CY = 360;

function arcGeometry(i: number) {
  return {
    rx: 280 + i * 18,
    ry: 120 + i * 10,
    rot: -8 + i * 1.1,
  };
}

/** Closed ellipse path for animateMotion — matches <ellipse> stroke geometry */
function ellipseOrbitPath(rx: number, ry: number, cx = ARC_CX, cy = ARC_CY, reverse = false) {
  const sweep = reverse ? 0 : 1;
  return `M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 ${sweep} ${cx - rx} ${cy} A ${rx} ${ry} 0 1 ${sweep} ${cx + rx} ${cy}`;
}

/** Dots on distinct arc rings — staggered speed, direction, and size */
const ORBITAL_DOTS = [
  { arcIndex: 1, dur: '14s', begin: '0s', reverse: true, size: 'sm' as const },
  { arcIndex: 3, dur: '17s', begin: '2.5s', size: 'sm' as const },
  { arcIndex: 5, dur: '20s', begin: '1s', reverse: true },
];

function ArcEllipses({ range }: { range: [number, number] }) {
  const [start, end] = range;
  return (
    <>
      {Array.from({ length: end - start + 1 }, (_, j) => {
        const i = start + j;
        const { rx, ry, rot } = arcGeometry(i);
        const stroke = i % 4 === 0
          ? 'url(#feature-arc-teal)'
          : i % 4 === 1
            ? 'url(#feature-arc-blue)'
            : i % 4 === 2
              ? 'url(#feature-arc-pink)'
              : 'url(#feature-arc-orange)';
        return (
          <ellipse
            key={i}
            cx={ARC_CX}
            cy={ARC_CY}
            rx={rx}
            ry={ry}
            stroke={stroke}
            strokeWidth={0.9 - i * 0.02}
            opacity={0.92 - i * 0.038}
            transform={`rotate(${rot} ${ARC_CX} ${ARC_CY})`}
          />
        );
      })}
    </>
  );
}

type OrbitalDotProps = {
  arcIndex: number;
  dur: string;
  begin?: string;
  reverse?: boolean;
  size?: 'sm' | 'md';
  active: boolean;
  reducedMotion: boolean;
};

const DOT_SIZES = {
  sm: { halo: 7, core: 4, spec: 1.2 },
  md: { halo: 10, core: 6, spec: 2 },
};

/** Small glowing dot that travels along an arc ellipse */
function FeatureOrbitalDot({
  arcIndex,
  dur,
  begin = '0s',
  reverse = false,
  size = 'md',
  active,
  reducedMotion,
}: OrbitalDotProps) {
  if (!active) return null;

  const { rx, ry, rot } = arcGeometry(arcIndex);
  const path = ellipseOrbitPath(rx, ry, ARC_CX, ARC_CY, reverse);
  const shouldAnimate = !reducedMotion;
  const dot = DOT_SIZES[size];
  const staticX = ARC_CX + rx * (reverse ? -0.65 : 0.72);
  const staticY = ARC_CY - ry * 0.35;

  return (
    <g transform={`rotate(${rot} ${ARC_CX} ${ARC_CY})`}>
      <g transform={shouldAnimate ? undefined : `translate(${staticX} ${staticY})`}>
        {shouldAnimate ? (
          <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
        ) : null}
        <circle r={dot.halo} fill="url(#feature-dot-glow)" opacity="0.55" />
        <circle r={dot.core} fill="url(#feature-dot-core)" filter="url(#feature-dot-glow-filter)" />
        <circle cx="-1" cy="-1" r={dot.spec} fill="#ccfbf1" opacity="0.95" />
      </g>
    </g>
  );
}

function FeatureArcBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onMotionChange);
    return () => mq.removeEventListener('change', onMotionChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute left-1/2 top-1/2 h-[140%] w-[160%] -translate-x-1/2 -translate-y-[42%]"
        viewBox="0 0 1200 700"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="feature-arc-teal" x1="600" y1="60" x2="600" y2="640" gradientUnits="userSpaceOnUse">
            <stop stopColor="#008080" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#008080" stopOpacity="0.28" />
            <stop offset="1" stopColor="#008080" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="feature-arc-blue" x1="200" y1="200" x2="1000" y2="600" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00B1B1" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#00B1B1" stopOpacity="0.26" />
            <stop offset="1" stopColor="#00B1B1" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="feature-arc-pink" x1="600" y1="60" x2="600" y2="640" gradientUnits="userSpaceOnUse">
            <stop stopColor="#114852" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#114852" stopOpacity="0.28" />
            <stop offset="1" stopColor="#114852" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="feature-arc-orange" x1="200" y1="200" x2="1000" y2="600" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B262B" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#0B262B" stopOpacity="0.26" />
            <stop offset="1" stopColor="#0B262B" stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id="feature-dot-core" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#7fd9d9" />
            <stop offset="45%" stopColor="#008080" />
            <stop offset="100%" stopColor="#114852" />
          </radialGradient>
          <radialGradient id="feature-dot-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#008080" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#008080" stopOpacity="0" />
          </radialGradient>
          <filter id="feature-arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="feature-dot-glow-filter" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity={0.72} filter="url(#feature-arc-glow)">
          <ArcEllipses range={[0, ARC_COUNT - 1]} />
        </g>

        {ORBITAL_DOTS.map((dot) => (
          <FeatureOrbitalDot
            key={dot.arcIndex}
            arcIndex={dot.arcIndex}
            dur={dot.dur}
            begin={dot.begin}
            reverse={dot.reverse}
            size={dot.size}
            active={inView}
            reducedMotion={reducedMotion}
          />
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-[#040404]/15 via-transparent to-[#040404]/70" />
    </div>
  );
}

function FeatureCardView({ badge, headline, footer, actionLabel, actionTo }: FeatureCard) {
  return (
    <article className="analytics-card feature-card group relative h-[17.5rem] overflow-hidden p-5 sm:h-[18.5rem] sm:p-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#008080]/15 via-[#00B1B1]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
        aria-hidden
      />

      <div className="relative z-10 inline-flex w-fit items-center gap-2.5 rounded-full bg-white/[0.12] px-4 py-2 ring-1 ring-white/[0.14] backdrop-blur-sm">
        <BadgeIcon />
        <span className="text-[13px] font-medium text-white">{badge}</span>
      </div>

      <div className="absolute inset-x-5 bottom-[3.6rem] z-10 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-11 group-focus-within:-translate-y-11 sm:inset-x-6">
        <h3 className="text-sm font-bold leading-[1.65] tracking-tight text-white sm:text-[15px] sm:leading-[1.7]">
          {headline}
        </h3>

        <div className="mt-5 flex items-center gap-2">
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#008080]/20 text-[#008080] ring-1 ring-[#008080]/35">
            <CheckIcon />
          </span>
          <p className="text-[11px] font-medium leading-snug text-[#7aaea9]">{footer}</p>
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-5 z-10 flex justify-center translate-y-6 opacity-0 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-focus-within:pointer-events-auto sm:inset-x-6">
        <Link
          to={actionTo}
          className="btn-primary rounded-2xl px-3 py-2.5 text-sm max-w-[12rem] w-full"
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}

type LandingFeatureSectionProps = {
  features: FeatureCard[];
};

export default function LandingFeatureSection({ features }: LandingFeatureSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#040404] px-4 py-16 sm:py-20">
      <FeatureArcBackground />

      <div className="relative z-10 mx-auto max-w-5xl">
        <LandingSectionTitle
          badge="Platform Features"
          line1="A Complete Toolkit to"
          line2={
            <>
              <SectionGradientWord tone={0}>Secure</SectionGradientWord>{' '}
              <SectionGradientWord tone={1}>your next Role</SectionGradientWord>
            </>
          }
          subtitle="Six AI-powered modules that address every dimension of career readiness."
          className="mb-10 sm:mb-12"
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.badge} delay={i * 70} className="h-full">
              <FeatureCardView {...feature} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
