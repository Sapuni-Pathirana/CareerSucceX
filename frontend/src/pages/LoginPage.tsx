import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const quotes = [
  { text: 'Your career is built one step at a time.', author: 'CareerSucceX' },
  { text: 'Every expert was once a beginner.', author: 'Helen Hayes' },
  { text: 'Success is the sum of small efforts, repeated daily.', author: 'Robert Collier' },
];

const featureBadges = ['CV Analysis', 'GitHub Portfolio', 'Mock Interviews', 'Skill Quizzes'];

function BadgeDot() {
  return (
    <span
      className="h-[7px] w-[7px] shrink-0 rounded-full border border-[#008080]"
      aria-hidden
    />
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040404]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const q = quotes[Math.floor(Date.now() / 10000) % quotes.length];

  return (
    <div className="flex min-h-screen bg-[#040404]">
      {/* Left panel */}
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden bg-[#12121c] px-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background: `linear-gradient(
              90deg,
              rgba(4,4,4,0.5) 0%,
              rgba(11,38,43,0.4) 30%,
              rgba(0,128,128,0.28) 60%,
              rgba(0,177,177,0.18) 100%
            )`,
            filter: 'blur(75px)',
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.08]" aria-hidden />
        <div className="landing-hero-grain pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-lg animate-fade-in px-2">
          <Link to="/" className="mb-8 flex justify-center">
            <div className="brand-mark h-14 w-14 rounded-2xl">
              <span className="text-xl font-black text-white">CS</span>
            </div>
          </Link>

          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">CareerSucceX</h2>
          <p className="mb-8 mt-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#7aaea9]">
            Your career readiness platform
          </p>

          <blockquote className="rounded-[22px] border border-white/[0.06] bg-[#0B262B]/90 p-5 backdrop-blur-sm">
            <p className="text-sm font-medium leading-relaxed text-white/90">&ldquo;{q.text}&rdquo;</p>
            <footer className="mt-2 text-xs text-[#7aaea9]">— {q.author}</footer>
          </blockquote>

          <div className="mt-6 flex flex-nowrap items-center justify-center gap-1.5">
            {featureBadges.map((f) => (
              <span
                key={f}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[0.12] px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/[0.14] backdrop-blur-sm"
              >
                <BadgeDot />
                {f}
              </span>
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
            <div className="brand-mark h-11 w-11 rounded-xl lg:hidden">
              <span className="text-base font-black text-white">CS</span>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/[0.06] bg-[#0B262B] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-[#7aaea9]">Sign in to continue your career journey</p>

            {error && (
              <div className="mt-4">
                <ErrorAlert message={error} onDismiss={() => setError('')} theme="dark" />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-aurora btn-aurora--wide"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#7aaea9]">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#008080] transition-colors hover:text-white"
              >
                Create one →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
