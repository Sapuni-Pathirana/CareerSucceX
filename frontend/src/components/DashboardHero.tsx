import ScoreGauge from './ScoreGauge';
import { SectionGradientWord } from './LandingSectionTitle';

type DashboardHeroProps = {
  firstName: string;
  overall: number;
  statusLabel: string;
  statusPill: string;
  updatedAt?: string;
};

function ChartBadgeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#a78bfa]" fill="none" aria-hidden>
      <path d="M3 12V8M7 12V5M11 12V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DashboardHeroAmbient() {
  return (
    <div className="dashboard-hero-ambient" aria-hidden>
      <div className="dashboard-hero-ambient__blob dashboard-hero-ambient__blob--indigo" />
      <div className="dashboard-hero-ambient__blob dashboard-hero-ambient__blob--violet" />
      <div className="dashboard-hero-ambient__blob dashboard-hero-ambient__blob--amber" />
      <div className="dashboard-hero-ambient__blob dashboard-hero-ambient__blob--rose" />
      <div className="dashboard-hero-ambient__vignette" />
      <div className="dashboard-hero-ambient__grain" />
    </div>
  );
}

function DashboardHeroRing() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="dashboard-hero-ring dashboard-hero-ring--bloom" />
      <div className="dashboard-hero-ring dashboard-hero-ring--edge" />
    </div>
  );
}

export default function DashboardHero({
  firstName,
  overall,
  statusLabel,
  statusPill,
  updatedAt,
}: DashboardHeroProps) {
  return (
    <section className="dashboard-hero relative left-1/2 mb-10 w-screen max-w-none -translate-x-1/2 py-8 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -bottom-10 sm:-bottom-12">
        <DashboardHeroAmbient />
      </div>

      <div className="relative z-10 mx-auto flex justify-center px-4 sm:px-6">
        <div className="relative aspect-square w-full max-w-[min(96vw,540px)]">
          <DashboardHeroRing />

          <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center sm:px-10">
            <div className="flex max-w-[min(100%,340px)] flex-col items-center sm:max-w-[380px]">
              <div className="section-title-badge !mb-4 sm:!mb-5">
                <ChartBadgeIcon />
                <span>Live Dashboard</span>
              </div>

              <h1 className="dashboard-hero-heading text-white">
                <span>Hello,</span>{' '}
                <span className="section-title-accent hero-caption-shimmer">
                  <SectionGradientWord tone={0}>{firstName}</SectionGradientWord>
                </span>
              </h1>

              <p className="section-title-subtitle mx-auto mt-4 max-w-[300px] leading-7 sm:mt-5 sm:max-w-[340px] sm:leading-8">
                Track your progress across CV, GitHub, interviews, and verified skills in one place.
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center gap-5 sm:mt-7">
              <ScoreGauge score={overall} size={172} theme="dark" variant="hero" />

              <div className="flex flex-col items-center gap-3">
                <span className={`dash-badge px-4 py-2 text-sm ring-1 ${statusPill}`}>{statusLabel}</span>
                {updatedAt && (
                  <p className="text-xs leading-relaxed text-[#7aaea9] sm:text-sm">
                    Updated {new Date(updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
