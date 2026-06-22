import { Link } from 'react-router-dom';
import Navbar                from '../components/Navbar';
import LandingHeroBackground from '../components/LandingHeroBackground';
import LandingHeroCaptions   from '../components/LandingHeroCaptions';
import CountUp               from '../components/CountUp';
import LandingFeatureSection from '../components/LandingFeatureSection';
import LandingSectionTitle, { SectionGradientWord } from '../components/LandingSectionTitle';
import MarqueeStrip            from '../components/MarqueeStrip';
import ScrollReveal            from '../components/ScrollReveal';

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
    <div className="min-h-screen overflow-x-hidden bg-[#06070d]">
      {/* ── Floating Navbar ──────────────────────────── */}
      <Navbar />

      {/* ── Hero section ─────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20 text-center">
        <LandingHeroBackground />
        <LandingHeroCaptions />
      </section>

      {/* ── Stats section ───────────────────────────── */}
      <section className="relative border-y border-white/5 bg-[#06070d] py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <LandingSectionTitle
            badge="Career Impact"
            badgeIcon="chart"
            line1="Proven Outcomes for"
            line2={
              <>
                <SectionGradientWord tone={0}>Career</SectionGradientWord>{' '}
                <SectionGradientWord tone={1}>Success</SectionGradientWord>
              </>
            }
            subtitle="Documented results from candidates who used CareerSucceX to strengthen their readiness and secure employment."
            className="mb-12 sm:mb-14"
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 100}>
              <div className="text-center">
                <div className="text-5xl font-extrabold tabular-nums">
                  <CountUp
                    target={s.value}
                    decimals={s.decimals}
                    suffix={s.suffix}
                    className="text-gradient"
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-400">{s.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        </div>
      </section>

      {/* ── Marquee strip ───────────────────────────── */}
      <div className="bg-[#06070d] py-4">
        <MarqueeStrip
          items={marqueeItems}
          className="border-y border-white/5 py-3"
        />
      </div>

      {/* ── Features section (EternaCloud-style) ─────── */}
      <LandingFeatureSection features={features} />

      {/* ── CTA bottom (dark) ───────────────────────── */}
      <section className="relative overflow-hidden bg-sidebar-glow px-4 py-12 text-center sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-10" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-[80px]" />
        <div className="relative z-10 mx-auto max-w-4xl px-2">
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
            className="mb-5"
          />
          <ScrollReveal delay={350}>
            <Link
              to="/register"
              className="inline-block rounded-2xl bg-aurora px-10 py-4 text-base font-bold text-white
                         shadow-aurora transition-all duration-300 hover:scale-[1.04] hover:shadow-glow-lg"
            >
              Start for free →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="bg-[#080910] px-4 py-5 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} CareerSucceX · Built with AI for career success
      </footer>
    </div>
  );
}
