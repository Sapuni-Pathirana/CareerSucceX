import { useEffect, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { profileApi } from '../api/profile';
import { readinessApi } from '../api/readiness';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CountUp from '../components/CountUp';
import DashboardHero from '../components/DashboardHero';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import ScrollReveal from '../components/ScrollReveal';
import StatCard from '../components/StatCard';
import type { DashboardResponse, ReadinessHistoryPoint, ReadinessScore } from '../types';

const activityIcons: Record<string, string> = {
  CV_ANALYSIS:        '◉',
  GITHUB_ANALYSIS:    '⬡',
  MOCK_INTERVIEW:     '◎',
  SKILL_VERIFICATION: '⬟',
  READINESS_SCORE:    '◈',
};

const chartTooltipStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#241c3b',
  color: '#f8fafc',
  fontSize: '12px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [score, setScore] = useState<ReadinessScore | null>(null);
  const [history, setHistory] = useState<ReadinessHistoryPoint[]>([]);
  const [recs, setRecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const firstName = user?.profile?.fullName?.split(' ')[0] || 'there';
  const overall = Math.round(Number(score?.overallScore ?? dashboard?.readiness?.overallScore ?? 0));
  const breakdown = score?.breakdown ?? {};
  const bData = Object.entries(breakdown).map(([name, value]) => ({
    name: name.replace(/Score$/, '').replace(/([A-Z])/g, ' $1').trim(),
    value: Math.round(Number(value)),
  }));
  const histData = history.map((h) => ({
    date: new Date(h.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round(Number(h.overallScore)),
  }));
  const fmt = (v?: number) => (v != null && !isNaN(Number(v)) ? Math.round(Number(v)) : 0);

  const statusPill =
    overall >= 75
      ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/35'
      : overall >= 50
        ? 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/35'
        : overall >= 25
          ? 'bg-amber-500/10 text-amber-300 ring-amber-500/45'
          : 'bg-red-500/15 text-red-300 ring-red-500/35';

  const statusLabel =
    overall >= 75 ? 'Job Ready' :
    overall >= 50 ? 'On Track' :
    overall >= 25 ? 'In Progress' : 'Getting Started';

  return (
    <div className="space-y-8">
      <DashboardHero
        firstName={firstName}
        overall={overall}
        statusLabel={statusLabel}
        statusPill={statusPill}
        updatedAt={dashboard?.readiness?.calculatedAt}
      />

      {error && <ErrorAlert message={error} theme="dark" />}

      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ScrollReveal delay={80} className="h-full">
          <StatCard theme="dark" label="CV / ATS Score" value={fmt(dashboard?.cvScore)} accent="blue" icon="◉" delay={80} />
        </ScrollReveal>
        <ScrollReveal delay={160} className="h-full">
          <StatCard theme="dark" label="GitHub Score" value={fmt(dashboard?.githubScore)} accent="indigo" icon="⬡" delay={160} />
        </ScrollReveal>
        <ScrollReveal delay={240} className="h-full">
          <StatCard theme="dark" label="Interview Score" value={fmt(dashboard?.interviewScore)} accent="emerald" icon="◎" delay={240} />
        </ScrollReveal>
        <ScrollReveal delay={320} className="h-full">
          <StatCard theme="dark" label="Open Skill Gaps" value={dashboard?.skillGapCount ?? 0} accent="amber" icon="⬟" subtext="to address" delay={320} />
        </ScrollReveal>
      </div>

      {(dashboard?.verifiedSkillsCount ?? 0) > 0 && (
        <ScrollReveal>
          <div className="rounded-[22px] bg-aurora p-px shadow-aurora">
            <div className="flex flex-col items-start gap-4 rounded-[22px] bg-[#241c3b] px-6 py-5 sm:flex-row sm:items-center">
              <div className="text-4xl font-extrabold text-gradient">
                <CountUp target={dashboard!.verifiedSkillsCount} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Verified Skills</p>
                <p className="text-sm text-[#a099c0]">Backed by AI quiz badges</p>
              </div>
              <div className="hidden sm:block">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {histData.length > 0 && (
          <ScrollReveal delay={100}>
            <div className="dash-card p-6">
              <h2 className="mb-1 text-base font-semibold text-white">Score History</h2>
              <p className="mb-4 text-xs text-[#a099c0]">Your readiness over time</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={histData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a099c0' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#a099c0' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="score" stroke="#818cf8" fill="url(#areaGrad)" strokeWidth={2.5} dot={{ fill: '#a78bfa', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>
        )}

        {bData.length > 0 && (
          <ScrollReveal delay={200}>
            <div className="dash-card p-6">
              <h2 className="mb-1 text-base font-semibold text-white">Sub-scores</h2>
              <p className="mb-4 text-xs text-[#a099c0]">Breakdown by category</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={bData} layout="vertical">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#a099c0' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11, fill: '#a099c0' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal delay={100}>
          <div className="dash-card p-6">
            <h2 className="mb-4 text-base font-semibold text-white">Recommendations</h2>
            {recs.length === 0 ? (
              <p className="text-sm text-[#a099c0]">
                Complete CV analysis, connect GitHub, and take a mock interview for personalised tips.
              </p>
            ) : (
              <ul className="space-y-3">
                {recs.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/90 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
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
          <div className="dash-card p-6">
            <h2 className="mb-4 text-base font-semibold text-white">Recent Activity</h2>
            {dashboard?.recentActivity?.length ? (
              <ul className="divide-y divide-white/[0.06]">
                {dashboard.recentActivity.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm text-[#c4b5fd] ring-1 ring-white/10">
                      {activityIcons[item.type] ?? '●'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs capitalize text-[#8b83a8]">
                        {item.type.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-[#8b83a8]">
                      {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#a099c0]">No activity yet — start by uploading your CV.</p>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
