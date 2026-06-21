import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import ErrorAlert    from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const quotes = [
  { text: 'Your career is built one step at a time.', author: 'CareerSucceX' },
  { text: 'Every expert was once a beginner.', author: 'Helen Hayes' },
  { text: 'Success is the sum of small efforts, repeated daily.', author: 'Robert Collier' },
];

export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  if (authLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );

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
    <div className="flex min-h-screen">
      {/* Left panel — decorative */}
      <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-sidebar-glow lg:flex">
        {/* Orbs */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="absolute bottom-16 right-8 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-800/30 blur-3xl" />

        {/* Dot grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center animate-fade-in">
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-aurora shadow-aurora animate-float">
              <span className="text-2xl font-black text-white">CS</span>
            </div>
          </div>
          <h2 className="mb-2 text-3xl font-extrabold text-white">CareerSucceX</h2>
          <p className="text-indigo-300 text-sm font-medium uppercase tracking-widest mb-12">Your Career Readiness Platform</p>

          <blockquote className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-base font-medium italic text-indigo-100">"{q.text}"</p>
            <footer className="mt-3 text-sm text-indigo-400">— {q.author}</footer>
          </blockquote>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {['CV Analysis', 'Mock Interviews', 'Skill Quizzes'].map((f) => (
              <div key={f} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs text-indigo-300 backdrop-blur-sm">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-surface-50 bg-dot-pattern px-6 py-12">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-aurora shadow-aurora">
              <span className="text-lg font-black text-white">CS</span>
            </div>
          </div>

          <div className="card p-8 shadow-card">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue your career journey</p>

            {error && (
              <div className="mt-4">
                <ErrorAlert message={error} onDismiss={() => setError('')} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-aurora w-full justify-center gap-2 py-3 text-sm"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
                Create one →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
