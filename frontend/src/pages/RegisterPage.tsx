import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const features = [
  { title: 'CV Analysis', desc: 'AI-powered ATS score and feedback' },
  { title: 'GitHub Analytics', desc: 'Analyse your coding portfolio' },
  { title: 'Mock Interviews', desc: 'Practice with Gemini AI' },
  { title: 'Skill Quizzes', desc: 'Earn verified skill badges' },
];

function BadgeDot() {
  return (
    <span
      className="h-[7px] w-[7px] shrink-0 rounded-full border border-[#c4b5fd]"
      aria-hidden
    />
  );
}

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06070d]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#06070d]">
      {/* Left panel */}
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden bg-[#0d0b1a] px-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background: `linear-gradient(
              90deg,
              rgba(55,48,163,0.35) 0%,
              rgba(139,92,246,0.28) 45%,
              rgba(192,58,180,0.22) 100%
            )`,
            filter: 'blur(75px)',
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.08]" aria-hidden />
        <div className="landing-hero-grain pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-sm animate-fade-in">
          <Link to="/" className="mb-8 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aurora shadow-aurora">
              <span className="text-xl font-black text-white">CS</span>
            </div>
          </Link>

          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
            Begin building your{' '}
            <span className="hero-caption-gradient">career readiness</span>
          </h2>
          <p className="mb-8 mt-3 text-center text-sm text-[#a099c0]">
            Everything you need to secure your next role
          </p>

          <div className="space-y-2.5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="flex items-center gap-3 rounded-[18px] border border-white/[0.06] bg-[#241c3b]/90 px-4 py-3 backdrop-blur-sm animate-fade-in-left"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <BadgeDot />
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-[#a099c0]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.06]" aria-hidden />
        <Link
          to="/"
          className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full bg-white/[0.12] px-4 py-2 text-sm font-medium text-white ring-1 ring-white/[0.14] backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.18] hover:ring-white/25"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
            <path
              d="M10 3 5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Home
        </Link>

        <div className="relative z-10 w-full max-w-md animate-scale-in">
          <div className="mb-6 flex justify-center lg:mb-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-aurora shadow-aurora lg:hidden">
              <span className="text-base font-black text-white">CS</span>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/[0.06] bg-[#241c3b] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
            <p className="mt-1 text-sm text-[#a099c0]">Start building your career readiness profile</p>

            {error && (
              <div className="mt-4">
                <ErrorAlert message={error} onDismiss={() => setError('')} theme="dark" />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-white/90">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-dark"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/90">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/90">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark"
                  placeholder="At least 8 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-aurora px-5 py-3 text-sm font-semibold text-white shadow-aurora transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-lg disabled:opacity-70"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#a099c0]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#c4b5fd] transition-colors hover:text-white"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
