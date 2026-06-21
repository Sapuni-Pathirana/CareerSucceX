import { Link } from 'react-router-dom';
import Navbar       from '../components/Navbar';
import CountUp      from '../components/CountUp';
import MarqueeStrip from '../components/MarqueeStrip';
import ScrollReveal from '../components/ScrollReveal';

const stats = [
  { value: 94,  suffix: '%', label: 'Interview Success Rate' },
  { value: 3.2, suffix: 'x', label: 'Faster Skill Growth',   decimals: 1 },
  { value: 12,  suffix: 'k', label: 'Students Helped' },
  { value: 87,  suffix: '%', label: 'Land Their First Role' },
];

const features = [
  {
    icon: '◉',
    title: 'CV & ATS Analysis',
    desc: 'Upload your CV and receive an instant ATS compatibility score with line-by-line feedback powered by Gemini AI.',
    gradient: 'from-blue-500 to-brand-600',
  },
  {
    icon: '⬡',
    title: 'GitHub Intelligence',
    desc: 'Connect your GitHub to automatically extract skills, measure code quality, and identify strengths across your repos.',
    gradient: 'from-brand-500 to-purple-600',
  },
  {
    icon: '◎',
    title: 'Mock Interviews',
    desc: 'Practice realistic technical and behavioural interviews with our AI interviewer and get scored, actionable feedback.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: '⬟',
    title: 'Skill Verification',
    desc: 'Earn verified skill badges through AI-generated quizzes that prove your competency to future employers.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: '◈',
    title: 'Gap Analysis',
    desc: 'Set a target role and get a precise breakdown of which skills to develop next and by how much.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: '▣',
    title: 'Learning Roadmap',
    desc: 'Receive a personalised, prioritised learning roadmap that adapts as your skills grow.',
    gradient: 'from-rose-500 to-brand-500',
  },
];

const marqueeItems = [
  'AI-Powered CV Scoring', 'GitHub Portfolio Analysis', 'Mock Technical Interviews',
  'Skill Gap Detection', 'Verified Skill Badges', 'Personalised Roadmaps',
  'Real-time Readiness Score', 'Internship Readiness Tracker',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* ── Floating Navbar ──────────────────────────── */}
      <Navbar />

      {/* ── Hero section (dark) ─────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0b0c1a] px-4 pt-24 pb-16 text-center">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-2/3 right-1/4 h-80 w-80 rounded-full bg-purple-600/15 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-pink-600/10 blur-[80px]" />

        {/* Grid lines */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />

        <div className="relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 animate-fade-in backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            AI-Powered Career Readiness Platform
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-white animate-fade-in animate-delay-100 sm:text-6xl lg:text-7xl">
            Land your{' '}
            <span className="bg-aurora bg-clip-text text-transparent">
              internship
            </span>
            <br />with confidence
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 animate-fade-in animate-delay-200">
            CareerSucceX analyses your CV, GitHub, interview skills, and knowledge gaps — then gives you a real-time readiness score and a step-by-step plan to get hired.
          </p>

          {/* CTA row */}
          <div className="flex justify-center animate-fade-in animate-delay-300">
            <Link
              to="/register"
              className="rounded-2xl bg-aurora px-8 py-3.5 text-base font-semibold text-white
                         shadow-[0_4px_24px_rgba(99,102,241,0.45)] transition-all duration-300
                         hover:shadow-[0_8px_40px_rgba(99,102,241,0.6)] hover:scale-[1.04] active:scale-[0.97]"
            >
              Start for free →
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-slate-500 animate-fade-in animate-delay-400">
            Join thousands of students who improved their career readiness with AI
          </p>
        </div>
      </section>

      {/* ── Stats section ───────────────────────────── */}
      <section className="bg-[#0e0f20] border-y border-white/5 py-16 px-4">
        <div className="mx-auto max-w-5xl grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 100}>
              <div className="text-center">
                <div className="text-5xl font-extrabold text-gradient tabular-nums">
                  <CountUp target={s.value} decimals={s.decimals} suffix={s.suffix} />
                </div>
                <p className="mt-2 text-sm font-medium text-slate-400">{s.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Marquee strip ───────────────────────────── */}
      <div className="bg-[#0b0c1a] py-4">
        <MarqueeStrip
          items={marqueeItems}
          className="border-y border-white/5 py-3"
        />
      </div>

      {/* ── Features section (light) ─────────────────── */}
      <section className="bg-surface-50 bg-dot-pattern px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="mb-16 text-center">
              <span className="pill mb-3 bg-brand-100 text-brand-700">Platform Features</span>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Everything you need to get hired
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
                Six AI-powered modules that cover every angle of your career readiness.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 80}>
                <div className="card-hover group h-full p-6">
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-lg text-white shadow-glow-sm`}>
                    {f.icon}
                  </div>
                  <h3 className="mb-2 text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bottom (dark) ───────────────────────── */}
      <section className="relative overflow-hidden bg-sidebar-glow px-4 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-10" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-[80px]" />
        <ScrollReveal className="relative z-10 mx-auto max-w-2xl">
          <h2 className="mb-4 text-4xl font-extrabold text-white">
            Ready to accelerate your career?
          </h2>
          <p className="mb-8 text-slate-400">
            Create your free account and get your first readiness score in minutes.
          </p>
          <Link
            to="/register"
            className="inline-block rounded-2xl bg-aurora px-10 py-4 text-base font-bold text-white
                       shadow-aurora transition-all duration-300 hover:scale-[1.04] hover:shadow-glow-lg"
          >
            Start for free →
          </Link>
        </ScrollReveal>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="bg-[#080910] px-4 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} CareerSucceX · Built with AI for career success
      </footer>
    </div>
  );
}
