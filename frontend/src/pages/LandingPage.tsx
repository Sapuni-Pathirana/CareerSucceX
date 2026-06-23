import { Link } from 'react-router-dom';
import AnalyticsMetricIcon from '../components/AnalyticsMetricIcon';
import Navbar                from '../components/Navbar';
import LandingHeroBackground from '../components/LandingHeroBackground';
import LandingHeroCaptions   from '../components/LandingHeroCaptions';
import CountUp               from '../components/CountUp';
import LandingFeatureSection from '../components/LandingFeatureSection';
import LandingSectionTitle, { SectionGradientWord } from '../components/LandingSectionTitle';
import MarqueeStrip            from '../components/MarqueeStrip';
import ScrollReveal            from '../components/ScrollReveal';

const statTones = ['orange', 'teal', 'pink', 'blue'] as const;

const stats = [
  { value: 94,  suffix: '%', label: 'Interview Success Rate' },
  { value: 3.2, suffix: 'x', label: 'Faster Skill Growth',   decimals: 1 },
  { value: 12,  suffix: 'k', label: 'Careers Advanced' },
  { value: 87,  suffix: '%', label: 'Land Their First Role' },
];

const features = [
  {
    badge: 'CV Analysis',
    headline: 'Upload your CV and receive instant ATS scoring with line-by-line AI feedback.',
    footer: 'We own ATS compatibility',
    actionLabel: 'Upload CV',
    actionTo: '/cv',
  },
  {
    badge: 'GitHub',
    headline: 'Connect your repos to extract skills, measure quality, and surface strengths automatically.',
    footer: 'We own portfolio intelligence',
    actionLabel: 'Connect GitHub',
    actionTo: '/github',
  },
  {
    badge: 'Interviews',
    headline: 'Practice realistic technical and behavioural interviews with scored, actionable feedback.',
    footer: 'We own interview readiness',
    actionLabel: 'Start Interview',
    actionTo: '/interviews',
  },
  {
    badge: 'Verification',
    headline: 'Earn verified skill badges through AI quizzes that prove competency to employers.',
    footer: 'We own skill credibility',
    actionLabel: 'Verify Skills',
    actionTo: '/verification',
  },
  {
    badge: 'Gap Analysis',
    headline: 'Set a target role and get a precise breakdown of what to develop next.',
    footer: 'We own growth priorities',
    actionLabel: 'Analyze Gaps',
    actionTo: '/dashboard',
  },
  {
    badge: 'Roadmap',
    headline: 'Receive a personalised learning roadmap that adapts as your skills improve.',
    footer: 'We own your next steps',
    actionLabel: 'View Roadmap',
    actionTo: '/roadmap',
  },
];

const marqueeItems = [
  'AI-Powered CV Scoring', 'GitHub Portfolio Analysis', 'Mock Technical Interviews',
  'Skill Gap Detection', 'Verified Skill Badges', 'Personalised Roadmaps',
  'Real-time Readiness Score', 'Career Readiness Tracker',
];

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-hidden bg-[#040404]">
      {/* ── Floating Navbar ──────────────────────────── */}
      <Navbar />

      {/* ── Hero section ─────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20 text-center">
        <LandingHeroBackground />
        <LandingHeroCaptions />
      </section>

      {/* ── Stats section ───────────────────────────── */}
      <section className="relative border-y border-white/[0.06] bg-[#040404] py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <LandingSectionTitle
            badge="Career Impact"
            badgeIcon="chart"
            line1="Real results from"
            line2={
              <>
                <SectionGradientWord tone={0}>Career</SectionGradientWord>{' '}
                <SectionGradientWord tone={1}>Builders</SectionGradientWord>
              </>
            }
            subtitle="People who use CareerSucceX get interview-ready faster and land roles they're actually aiming for."
            className="mb-12 sm:mb-14"
          />

          <ScrollReveal delay={100}>
            <div className="analytics-card">
              <div className="analytics-kpi-row">
                {stats.map((s, i) => (
                  <article key={s.label} className="analytics-kpi">
                    <AnalyticsMetricIcon tone={statTones[i]} />
                    <p className="analytics-kpi__value">
                      <CountUp target={s.value} decimals={s.decimals} suffix={s.suffix} />
                    </p>
                    <p className="analytics-kpi__label">{s.label}</p>
                  </article>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Marquee strip ───────────────────────────── */}
      <div className="bg-[#040404] py-4">
        <MarqueeStrip
          items={marqueeItems}
          theme="dark"
          className="border-y border-white/[0.06] py-3"
        />
      </div>

      {/* ── Features section (EternaCloud-style) ─────── */}
      <LandingFeatureSection features={features} />

      {/* ── CTA bottom (dark) ───────────────────────── */}
      <section className="relative overflow-hidden bg-[#040404] px-4 py-16 text-center sm:py-20">
        <div className="analytics-card relative z-10 mx-auto max-w-4xl px-6 py-10 sm:px-10 sm:py-12">
          <LandingSectionTitle
            badge="Get Started"
            badgeIcon="rocket"
            line1="Begin Building your"
            line2={
              <>
                <SectionGradientWord tone={0}>Career</SectionGradientWord>{' '}
                <SectionGradientWord tone={1}>Readiness</SectionGradientWord>
              </>
            }
            subtitle="Create a free account and receive your first readiness score within minutes."
            className="mb-6"
          />
          <ScrollReveal delay={350}>
            <Link to="/register" className="landing-cta-btn">
              Start for free →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-[#040404] px-4 py-5 text-center text-xs text-[#5a8885]">
        © {new Date().getFullYear()} CareerSucceX · Built with AI for career success
      </footer>
    </div>
  );
}
