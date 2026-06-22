import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

const GRADIENT_TONES = [
  'section-title-word--sky',
  'section-title-word--violet',
  'section-title-word--pink',
  'section-title-word--amber',
] as const;

export function SectionGradientWord({
  tone,
  children,
}: {
  tone: 0 | 1 | 2 | 3;
  children: ReactNode;
}) {
  return (
    <span className={`section-title-word ${GRADIENT_TONES[tone]}`}>{children}</span>
  );
}

function LayersBadgeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#a78bfa]" fill="currentColor" aria-hidden>
      <path d="M8 1.5 1.75 5 8 8.5 14.25 5 8 1.5Z" opacity="0.45" />
      <path d="M1.75 8 8 11.5 14.25 8 8 4.5 1.75 8Z" opacity="0.7" />
      <path d="M1.75 11 8 14.5 14.25 11 8 7.5 1.75 11Z" />
    </svg>
  );
}

function ChartBadgeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#a78bfa]" fill="none" aria-hidden>
      <path d="M3 12V8M7 12V5M11 12V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RocketBadgeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#a78bfa]" fill="none" aria-hidden>
      <path
        d="M8 2.5c2.2 2.4 3.5 5.2 3.5 8.5 0 .6-.5 1-1 1H5.5c-.5 0-1-.4-1-1 0-3.3 1.3-6.1 3.5-8.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M8 12v2M6 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const BADGE_ICONS = {
  layers: LayersBadgeIcon,
  chart: ChartBadgeIcon,
  rocket: RocketBadgeIcon,
} as const;

function SectionTitlePart({
  children,
  visible,
  delay,
  className = '',
}: {
  children: ReactNode;
  visible: boolean;
  delay: number;
  className?: string;
}) {
  return (
    <div
      className={`hero-caption-item ${visible ? 'hero-caption-item--visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

type LandingSectionTitleProps = {
  badge: string;
  badgeIcon?: keyof typeof BADGE_ICONS;
  line1: string;
  line2: ReactNode;
  subtitle?: string;
  className?: string;
};

export default function LandingSectionTitle({
  badge,
  badgeIcon = 'layers',
  line1,
  line2,
  subtitle,
  className = '',
}: LandingSectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const Icon = BADGE_ICONS[badgeIcon];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`mx-auto max-w-4xl text-center ${className}`}>
      <SectionTitlePart visible={visible} delay={0}>
        <div className="section-title-badge">
          <Icon />
          <span>{badge}</span>
        </div>
      </SectionTitlePart>

      <SectionTitlePart visible={visible} delay={150}>
        <h2 className="section-title-heading text-white">
          <span>{line1}</span>{' '}
          <span className={visible ? 'section-title-accent hero-caption-shimmer' : 'section-title-accent'}>
            {line2}
          </span>
        </h2>
      </SectionTitlePart>

      {subtitle ? (
        <SectionTitlePart visible={visible} delay={300} className="mt-4">
          <p className="section-title-subtitle mx-auto max-w-xl">{subtitle}</p>
        </SectionTitlePart>
      ) : null}
    </div>
  );
}
