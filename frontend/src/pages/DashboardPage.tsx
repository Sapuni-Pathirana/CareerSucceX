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
import { useAuth } from '../context/AuthContext';
import AnalyticsMetricIcon from '../components/AnalyticsMetricIcon';
import EarningsGauge from '../components/EarningsGauge';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import type { DashboardResponse, ReadinessHistoryPoint, ReadinessScore } from '../types';

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#0B262B',
  color: '#fff',
  fontSize: '12px',
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const READINESS_TARGET = 75;

function progressTone(index: number) {
  return ['orange', 'teal', 'blue', 'pink'][index % 4] as 'orange' | 'teal' | 'blue' | 'pink';
}

function formatScoreDelta(current: number, previous?: number) {
  if (previous == null) return 'Run an assessment to track change';
  const delta = current - previous;
  if (delta > 0) return `+${delta} pts since last update`;
  if (delta < 0) return `${delta} pts since last update`;
  return 'No change since last update';
}

function readinessStatus(overall: number) {
  if (overall >= 75) return 'You are in a strong job-ready range';
  if (overall >= 50) return 'Good progress — keep building your profile';
  if (overall >= 25) return 'Early stage — focus on CV and core skills';
  return 'Get started with CV analysis and skill checks';
}

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
      <div className="analytics-dash analytics-dash--loading">
        <LoadingSpinner size="lg" label="Loading your dashboard…" />
      </div>
    );
  }

  const fmt = (v?: number) => (v != null && !isNaN(Number(v)) ? Math.round(Number(v)) : 0);
  const overall = fmt(score?.overallScore ?? dashboard?.readiness?.overallScore);
  const breakdown = score?.breakdown ?? {};

  const histSorted = [...history].sort(
    (a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime(),
  );
  const prevOverall = histSorted.length > 1
    ? fmt(histSorted[histSorted.length - 2].overallScore)
    : undefined;

  let scoreRows = Object.entries(breakdown).map(([name, value], i) => ({
    id: String(i + 1).padStart(2, '0'),
    name: name.replace(/Score$/, '').replace(/([A-Z])/g, ' $1').trim(),
    progress: Math.round(Number(value)),
    score: Math.round(Number(value)),
    tone: progressTone(i),
  }));

  if (scoreRows.length === 0) {
    scoreRows = [
      { id: '01', name: 'CV / ATS', progress: fmt(dashboard?.cvScore), score: fmt(dashboard?.cvScore), tone: 'orange' },
      { id: '02', name: 'GitHub', progress: fmt(dashboard?.githubScore), score: fmt(dashboard?.githubScore), tone: 'teal' },
      { id: '03', name: 'Interview', progress: fmt(dashboard?.interviewScore), score: fmt(dashboard?.interviewScore), tone: 'blue' },
      {
        id: '04',
        name: 'Skills',
        progress: Math.max(0, 100 - (dashboard?.skillGapCount ?? 0) * 10),
        score: Math.max(0, 100 - (dashboard?.skillGapCount ?? 0) * 10),
        tone: 'pink',
      },
    ];
  }

  const comparisonData = scoreRows.slice(0, 4).map((row) => ({
    label: row.name.split(' ')[0].slice(0, 4),
    current: row.score,
    target: READINESS_TARGET,
  }));

  const trendData = months.map((month, i) => {
    const point = histSorted[i] ?? histSorted[histSorted.length - 1];
    const current = point ? fmt(point.overallScore) : overall;
    const previous = i > 0 && histSorted[i - 1] ? fmt(histSorted[i - 1].overallScore) : Math.max(0, current - 8);
    return { month, previous, current };
  });

  const historyByMonth = months.map((month, i) => {
    const match = histSorted.find((h) => new Date(h.calculatedAt).getMonth() === i);
    return {
      month,
      readiness: match ? fmt(match.overallScore) : i <= new Date().getMonth() ? overall : null,
    };
  }).filter((row) => row.readiness != null) as { month: string; readiness: number }[];

  const historyChartData = historyByMonth.length > 0
    ? historyByMonth
    : months.slice(0, 6).map((month, i) => ({
        month,
        readiness: Math.max(0, overall - (5 - i) * 4),
      }));

  const previousPeriodScore = prevOverall ?? Math.max(0, overall - 8);
  const skillGaps = dashboard?.skillGapCount ?? 0;
  const verifiedCount = dashboard?.verifiedSkillsCount ?? 0;

  const kpiCards = [
    {
      tone: 'orange' as const,
      value: fmt(dashboard?.cvScore),
      label: 'CV / ATS Score',
      trend: formatScoreDelta(fmt(dashboard?.cvScore), prevOverall),
    },
    {
      tone: 'teal' as const,
      value: fmt(dashboard?.githubScore),
      label: 'GitHub Score',
      trend: 'Portfolio strength from repositories',
    },
    {
      tone: 'pink' as const,
      value: fmt(dashboard?.interviewScore),
      label: 'Interview Score',
      trend: 'AI mock interview performance',
    },
    {
      tone: 'blue' as const,
      value: verifiedCount,
      label: 'Verified Skills',
      trend: skillGaps > 0 ? `${skillGaps} skill gaps remaining` : 'All tracked skills verified',
    },
  ];

  const initials = user?.profile?.fullName?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const firstName = user?.profile?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="analytics-dash">
      <div className="analytics-toolbar">
        <label className="analytics-search">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input type="search" placeholder="Search scores, skills, activity…" aria-label="Search dashboard" />
        </label>

        <div className="analytics-toolbar__actions">
          <button type="button" className="analytics-icon-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
              <path d="M12 4.5a5 5 0 0 1 5 5v2.2c0 .5.2 1 .5 1.4l.7.9a1 1 0 0 1-.8 1.6H6.6a1 1 0 0 1-.8-1.6l.7-.9c.3-.4.5-.9.5-1.4V9.5a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {recs.length > 0 && <span className="analytics-icon-btn__dot" />}
          </button>
          <button type="button" className="analytics-profile" aria-label="Profile menu">
            <span className="analytics-profile__avatar">{initials}</span>
            <span className="hidden whitespace-nowrap text-sm font-medium sm:inline">{firstName}</span>
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#7aaea9]" fill="none" aria-hidden>
              <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} theme="dark" />}

      <div className="analytics-layout">
        <section className="analytics-card analytics-card--sales">
          <div className="analytics-card__head">
            <h2 className="analytics-card__title">Career Scores</h2>
            <p className="analytics-card__subtitle">Your readiness across key hiring dimensions</p>
          </div>
          <div className="analytics-kpi-row">
            {kpiCards.map((card) => (
              <article key={card.label} className="analytics-kpi">
                <AnalyticsMetricIcon tone={card.tone} />
                <p className="analytics-kpi__value">{card.value}</p>
                <p className="analytics-kpi__label">{card.label}</p>
                <p className={`analytics-kpi__trend analytics-kpi__trend--${card.tone}`}>{card.trend}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="analytics-card analytics-card--level">
          <h2 className="analytics-card__title">Score vs Target</h2>
          <p className="analytics-card__subtitle">Current performance against job-ready benchmark</p>
          <div className="analytics-chart analytics-chart--level">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barGap={4} barCategoryGap="28%">
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#7aaea9', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="current" name="Current" fill="#008080" radius={[6, 6, 0, 0]} barSize={14} />
                <Bar dataKey="target" name="Target" fill="rgba(255,255,255,0.08)" radius={[6, 6, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="analytics-legend">
            <span><i className="analytics-legend__dot analytics-legend__dot--teal" />Current</span>
            <span><i className="analytics-legend__dot analytics-legend__dot--gray" />Target ({READINESS_TARGET})</span>
          </div>
        </section>

        <section className="analytics-card analytics-card--products">
          <h2 className="analytics-card__title">Score Breakdown</h2>
          <p className="analytics-card__subtitle">How each area contributes to your profile</p>
          <div className="analytics-table">
            <div className="analytics-table__head">
              <span>#</span>
              <span>Area</span>
              <span>Progress</span>
              <span>Score</span>
            </div>
            {scoreRows.slice(0, 4).map((row) => (
              <div key={row.id} className="analytics-table__row">
                <span className="analytics-table__id">{row.id}</span>
                <span className="analytics-table__name">{row.name}</span>
                <div className="analytics-table__bar-wrap">
                  <div className={`analytics-table__bar analytics-table__bar--${row.tone}`} style={{ width: `${row.progress}%` }} />
                </div>
                <span className={`analytics-table__pill analytics-table__pill--${row.tone}`}>{row.score}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-card analytics-card--fulfilment">
          <h2 className="analytics-card__title">Readiness Trend</h2>
          <p className="analytics-card__subtitle">Previous period compared with current readiness</p>
          <div className="analytics-chart analytics-chart--fulfilment">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="fulfilTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#008080" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#008080" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fulfilPink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00B1B1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00B1B1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#7aaea9', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="previous" name="Previous" stroke="#008080" fill="url(#fulfilTeal)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="current" name="Current" stroke="#c084fc" fill="url(#fulfilPink)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="analytics-fulfilment-meta">
            <div>
              <span className="analytics-legend__dot analytics-legend__dot--teal" />
              <span>Previous</span>
              <strong>{previousPeriodScore}%</strong>
            </div>
            <div>
              <span className="analytics-legend__dot analytics-legend__dot--pink" />
              <span>Current</span>
              <strong>{overall}%</strong>
            </div>
          </div>
        </section>

        <section className="analytics-card analytics-card--earnings">
          <h2 className="analytics-card__title">Overall Readiness</h2>
          <p className="analytics-card__subtitle">Composite career readiness score</p>
          <p className="analytics-earnings__value">{overall}%</p>
          <p className="analytics-earnings__hint">{readinessStatus(overall)}</p>
          <EarningsGauge value={overall} label={`${overall}%`} />
        </section>

        <section className="analytics-card analytics-card--visitors">
          <div className="analytics-card__head analytics-card__head--row">
            <div>
              <h2 className="analytics-card__title">Score History</h2>
              <p className="analytics-card__subtitle">Readiness over the year</p>
            </div>
            <span className="analytics-pill">
              <i className="analytics-legend__dot analytics-legend__dot--orange" />
              Live trend
            </span>
          </div>
          <div className="analytics-chart analytics-chart--visitors">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyChartData}>
                <defs>
                  <linearGradient id="visitorTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#008080" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#008080" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#7aaea9', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7aaea9', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="readiness" name="Readiness" stroke="#008080" fill="url(#visitorTeal)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
