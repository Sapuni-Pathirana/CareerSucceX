import { useEffect, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { profileApi }  from '../api/profile';
import { readinessApi } from '../api/readiness';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CountUp        from '../components/CountUp';
import ErrorAlert     from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import MarqueeStrip   from '../components/MarqueeStrip';
import PageHeader     from '../components/PageHeader';
import ScoreGauge     from '../components/ScoreGauge';
import ScrollReveal   from '../components/ScrollReveal';
import StatCard       from '../components/StatCard';
import type { DashboardResponse, ReadinessHistoryPoint, ReadinessScore } from '../types';

const TIPS = [
  'Upload your CV to detect skills automatically',
  'Connect GitHub to analyse your repositories',
  'Take a mock interview to improve your score',
  'Verify skills with AI quizzes to earn badges',
  'Set a target role for gap analysis',
  'Follow your learning roadmap daily',
];

const activityIcons: Record<string, string> = {
  CV_ANALYSIS:        '◉',
  GITHUB_ANALYSIS:    '⬡',
  MOCK_INTERVIEW:     '◎',
  SKILL_VERIFICATION: '⬟',
  READINESS_SCORE:    '◈',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [score,     setScore]     = useState<ReadinessScore | null>(null);
  const [history,   setHistory]   = useState<ReadinessHistoryPoint[]>([]);
  const [recs,      setRecs]      = useState<string[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [dash, s, hist, r] = await Promise.all([
          profileApi.getDashboard(),
          readinessApi.getScore().catch(() => null),
          readinessApi.getHistory().catch(() => []),
          readinessApi.getRecommendations().catch(() => []),
        ]);
        setDashboard(dash);
        setScore(s);
        setHistory(hist);
        setRecs(r);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading your dashboard…" />
      </div>
    );
  }

  const firstName  = user?.profile?.fullName?.split(' ')[0] || 'there';
  const overall    = Math.round(Number(score?.overallScore ?? dashboard?.readiness?.overallScore ?? 0));
  const breakdown  = score?.breakdown ?? {};
  const bData      = Object.entries(breakdown).map(([name, value]) => ({
    name: name.replace(/Score$/, '').replace(/([A-Z])/g, ' $1').trim(),
    value: Math.round(Number(value)),
  }));
  const histData   = history.map((h) => ({
    date:  new Date(h.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round(Number(h.overallScore)),
  }));
  const fmt        = (v?: number) => (v != null && !isNaN(Number(v)) ? Math.round(Number(v)) : 0);

  return (
    <div className="space-y-8">
      {/* ── Marquee strip ──────────────────────────── */}
      <MarqueeStrip items={TIPS} className="rounded-xl border border-brand-100 bg-brand-50 py-2.5" />

      {/* ── Hero header ─────────────────────────────── */}
      <PageHeader
        title={`Hello, ${firstName} 👋`}
        description="Your internship readiness snapshot — updated in real time"
        badge="Live Dashboard"
      />

      {error && <ErrorAlert message={error} />}

      {/* ── Main score + stat cards ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Readiness gauge */}
        <ScrollReveal className="lg:col-span-1">
          <div className="card relative flex flex-col items-center justify-center overflow-hidden p-8">
            {/* Aurora bg glow */}
            <div className="absolute inset-0 bg-aurora-soft opacity-60" />
            <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-300/20 blur-3xl" />

            <div className="relative">
              <ScoreGauge score={overall} label="Readiness Score" size={180} />
              {dashboard?.readiness?.calculatedAt && (
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  Updated {new Date(dashboard.readiness.calculatedAt).toLocaleString()}
                </p>
              )}
              <div className="mt-4 flex justify-center">
                <span className={`pill text-sm font-bold ${
                  overall >= 75 ? 'bg-emerald-100 text-emerald-700' :
                  overall >= 50 ? 'bg-brand-100 text-brand-700' :
                  overall >= 25 ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                }`}>
                  {overall >= 75 ? 'Job Ready' :
                   overall >= 50 ? 'On Track' :
                   overall >= 25 ? 'In Progress' : 'Getting Started'}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard label="CV / ATS Score"    value={fmt(dashboard?.cvScore)}        accent="blue"    icon="◉" delay={100} />
          <StatCard label="GitHub Score"       value={fmt(dashboard?.githubScore)}    accent="indigo"  icon="⬡" delay={200} />
          <StatCard label="Interview Score"    value={fmt(dashboard?.interviewScore)} accent="emerald" icon="◎" delay={300} />
          <StatCard label="Open Skill Gaps"    value={dashboard?.skillGapCount ?? 0}  accent="amber"   icon="⬟" delay={400} subtext="to address" />
        </div>
      </div>

      {/* ── Verified skills count callout ───────────── */}
      {(dashboard?.verifiedSkillsCount ?? 0) > 0 && (
        <ScrollReveal>
          <div className="rounded-2xl bg-aurora p-px shadow-aurora">
            <div className="flex items-center gap-6 rounded-2xl bg-white/95 px-6 py-4">
              <div className="text-4xl font-extrabold text-gradient">
                <CountUp target={dashboard!.verifiedSkillsCount} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Verified Skills</p>
                <p className="text-sm text-slate-500">Backed by AI quiz badges</p>
              </div>
              <div className="ml-auto hidden sm:block">
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(dashboard!.verifiedSkillsCount, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-2 rounded-full bg-aurora"
                      style={{ opacity: 0.4 + (i / 8) * 0.6 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* ── Charts ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {histData.length > 0 && (
          <ScrollReveal delay={100}>
            <div className="card p-6">
              <h2 className="mb-1 text-base font-semibold text-slate-900">Score History</h2>
              <p className="mb-4 text-xs text-slate-400">Your readiness over time</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={histData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 24px rgba(99,102,241,0.12)',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#areaGrad)" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>
        )}

        {bData.length > 0 && (
          <ScrollReveal delay={200}>
            <div className="card p-6">
              <h2 className="mb-1 text-base font-semibold text-slate-900">Sub-scores</h2>
              <p className="mb-4 text-xs text-slate-400">Breakdown by category</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bData} layout="vertical">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* ── Recommendations + Activity ───────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal delay={100}>
          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Recommendations</h2>
            {recs.length === 0 ? (
              <p className="text-sm text-slate-500">
                Complete CV analysis, connect GitHub, and take a mock interview for personalised tips.
              </p>
            ) : (
              <ul className="space-y-3">
                {recs.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-aurora text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Recent Activity</h2>
            {dashboard?.recentActivity?.length ? (
              <ul className="divide-y divide-slate-50">
                {dashboard.recentActivity.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm text-brand-500">
                      {activityIcons[item.type] ?? '●'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs capitalize text-slate-400">
                        {item.type.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No activity yet — start by uploading your CV!</p>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
