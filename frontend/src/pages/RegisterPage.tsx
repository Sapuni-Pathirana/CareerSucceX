import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import ErrorAlert    from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';

const features = [
  { icon: '◉', title: 'CV Analysis',       desc: 'AI-powered ATS score & feedback' },
  { icon: '⬡', title: 'GitHub Analytics',  desc: 'Analyse your coding portfolio' },
  { icon: '◎', title: 'Mock Interviews',   desc: 'Practice with Gemini AI' },
  { icon: '⬟', title: 'Skill Quizzes',    desc: 'Earn verified skill badges' },
];

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  if (authLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );

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
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-sidebar-glow lg:flex">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute bottom-16 -left-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-dot-pattern opacity-10" />

        <div className="relative z-10 max-w-sm animate-fade-in">
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-aurora shadow-aurora animate-float">
              <span className="text-2xl font-black text-white">CS</span>
            </div>
          </div>
          <h2 className="mb-2 text-center text-3xl font-extrabold text-white">Get Career Ready</h2>
          <p className="mb-10 text-center text-sm text-indigo-300">Everything you need to land your next role</p>

          <div className="space-y-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm animate-fade-in-left"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-aurora text-sm text-white shadow-glow-sm">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-indigo-300">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-surface-50 bg-dot-pattern px-6 py-12">
        <div className="w-full max-w-md animate-scale-in">
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-aurora shadow-aurora">
              <span className="text-lg font-black text-white">CS</span>
            </div>
          </div>

          <div className="card p-8 shadow-card">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Start building your career readiness profile</p>

            {error && (
              <div className="mt-4">
                <ErrorAlert message={error} onDismiss={() => setError('')} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  placeholder="Sapuni Pathirana"
                />
              </div>
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="At least 8 characters"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-aurora w-full justify-center gap-2 py-3 text-sm"
              >
                {loading ? <LoadingSpinner size="sm" /> : null}
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
