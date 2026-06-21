import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { profileApi } from '../api/profile';
import { readinessApi } from '../api/readiness';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import ScoreGauge from '../components/ScoreGauge';
import StatCard from '../components/StatCard';
import type { DashboardResponse, ReadinessHistoryPoint, ReadinessScore } from '../types';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [score, setScore] = useState<ReadinessScore | null>(null);
  const [history, setHistory] = useState<ReadinessHistoryPoint[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [dash, readinessScore, hist, recs] = await Promise.all([
          profileApi.getDashboard(),
          readinessApi.getScore().catch(() => null),
          readinessApi.getHistory().catch(() => []),
          readinessApi.getRecommendations().catch(() => []),
        ]);
        setDashboard(dash);
        setScore(readinessScore);
        setHistory(hist);
        setRecommendations(recs);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const overallScore = Number(score?.overallScore ?? dashboard?.readiness?.overallScore ?? 0);
  const breakdown = score?.breakdown ?? {};
  const breakdownData = Object.entries(breakdown).map(([name, value]) => ({
    name: name.replace(/Score$/, '').replace(/([A-Z])/g, ' $1').trim(),
    value: Number(value),
  }));

  const historyData = history.map((h) => ({
    date: new Date(h.calculatedAt).toLocaleDateString(),
    score: Number(h.overallScore),
  }));

  const formatScore = (v?: number) => (v != null ? Math.round(Number(v)) : '—');

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.profile?.fullName?.split(' ')[0] || 'there'}!`}
        description="Your internship readiness at a glance"
      />

      {error && (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <ScoreGauge score={overallScore} label="Readiness Score" />
          {dashboard?.readiness?.calculatedAt && (
            <p className="mt-2 text-xs text-slate-500">
              Updated {new Date(dashboard.readiness.calculatedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard label="CV / ATS" value={formatScore(dashboard?.cvScore)} accent="blue" />
          <StatCard label="GitHub" value={formatScore(dashboard?.githubScore)} accent="indigo" />
          <StatCard label="Interviews" value={formatScore(dashboard?.interviewScore)} accent="emerald" />
          <StatCard label="Skill Gaps" value={dashboard?.skillGapCount ?? 0} accent="amber" subtext="to address" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {historyData.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Score History</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#scoreGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {breakdownData.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Sub-scores</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={breakdownData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recommendations</h2>
          {recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">
              Complete CV analysis, connect GitHub, and take a mock interview to get personalized tips.
            </p>
          ) : (
            <ul className="space-y-3">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Activity</h2>
          {dashboard?.recentActivity?.length ? (
            <ul className="divide-y divide-slate-100">
              {dashboard.recentActivity.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs capitalize text-slate-500">{item.type.replace(/_/g, ' ').toLowerCase()}</p>
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No recent activity yet. Start by uploading your CV!</p>
          )}
        </div>
      </div>
    </div>
  );
}
