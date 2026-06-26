import { useEffect, useState, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
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
import AnalyticsMetricIcon from '../components/AnalyticsMetricIcon';
import EarningsGauge from '../components/EarningsGauge';
import LoadingSpinner from '../components/LoadingSpinner';
import type { DashboardResponse, ReadinessHistoryPoint, ReadinessScore } from '../types';

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#0B262B',
  color: '#fff',
  fontSize: '12px',
};

const READINESS_TARGET = 75;

const BREAKDOWN_ORDER = ['cv', 'github', 'skills', 'interview', 'verification'] as const;

const breakdownLabels: Record<string, string> = {
  cv: 'CV / ATS',
  github: 'GitHub',
  skills: 'Skills',
  interview: 'Interview',
  verification: 'Verification',
};

const chartLabels: Record<string, string> = {
  cv: 'CV',
  github: 'GitHub',
  skills: 'Skills',
  interview: 'Interview',
  verification: 'Verified',
};

function progressTone(index: number) {
  return ['orange', 'teal', 'blue', 'pink'][index % 4] as 'orange' | 'teal' | 'blue' | 'pink';
}

const barColors: Record<ReturnType<typeof progressTone>, string> = {
  orange: '#008080',
  teal: '#008080',
  blue: '#00B1B1',
  pink: '#00B1B1',
};

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
  const location = useLocation();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [score, setScore] = useState<ReadinessScore | null>(null);
  const [history, setHistory] = useState<ReadinessHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.pathname !== '/dashboard') return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [dash, s, hist] = await Promise.all([
          profileApi.getDashboard(),
          readinessApi.getScore().catch(() => null),
          readinessApi.getHistory().catch(() => []),
        ]);
        if (cancelled) return;
        setDashboard(dash);
        setScore(s);
        setHistory(hist);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.key]);

  if (loading) {
    return (
      <div className="analytics-dash analytics-dash--loading">
        <LoadingSpinner size="lg" label="Loading your dashboard…" />
      </div>
    );
  }

  const fmt = (v?: number | string | null) => {
    if (v == null || v === '') return 0;
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0;
  };
  const overall = fmt(score?.overallScore ?? dashboard?.readiness?.overallScore);
  const breakdown = score?.breakdown ?? {};

  const histSorted = [...history].sort(
    (a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime(),
  );
  const prevOverall = histSorted.length > 1
    ? fmt(histSorted[histSorted.length - 2].overallScore)
    : undefined;

  const cvScore = fmt(breakdown.cv ?? dashboard?.cvScore);
  const githubScore = fmt(breakdown.github ?? dashboard?.githubScore);
  const interviewScore = fmt(breakdown.interview ?? dashboard?.interviewScore);
  const skillsScore = fmt(breakdown.skills ?? dashboard?.skillsScore);
  const verificationScore = fmt(breakdown.verification ?? dashboard?.verificationScore);

  const scoreRows = BREAKDOWN_ORDER.map((key, i) => {
    const value =
      key === 'cv' ? cvScore
      : key === 'github' ? githubScore
      : key === 'interview' ? interviewScore
      : key === 'skills' ? skillsScore
      : verificationScore;
    return {
      id: String(i + 1).padStart(2, '0'),
      name: breakdownLabels[key],
      progress: value,
      score: value,
      tone: progressTone(i),
    };
  });

  const comparisonData = BREAKDOWN_ORDER.map((key, i) => ({
    label: chartLabels[key],
    current: scoreRows[i].score,
    target: READINESS_TARGET,
  }));

  const trendData = histSorted.length > 1
    ? histSorted.map((point, i) => ({
        month: new Date(point.calculatedAt).toLocaleDateString('en-US', { month: 'short' }),
        previous: i > 0 ? fmt(histSorted[i - 1].overallScore) : fmt(point.overallScore),
        current: fmt(point.overallScore),
      }))
    : [{ month: 'Now', previous: overall, current: overall }];

  const historyChartData = histSorted.length > 0
    ? histSorted.map((point) => ({
        month: new Date(point.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        readiness: fmt(point.overallScore),
      }))
    : [{ month: 'Now', readiness: overall }];

  const previousPeriodScore = prevOverall ?? overall;
  const skillGaps = dashboard?.skillGapCount ?? 0;
  const verifiedCount = dashboard?.verifiedSkillsCount ?? 0;
  const verifiedRequired = dashboard?.verifiedRequiredCount ?? 0;
  const requiredSkills = dashboard?.requiredSkillsCount ?? 0;

  const verificationTrend = verifiedCount === 0
    ? 'Complete a skill quiz on Skills to verify'
    : requiredSkills > 0
      ? `${verifiedRequired} of ${requiredSkills} required verified · ${verifiedCount} total`
      : `${verifiedCount} skill${verifiedCount === 1 ? '' : 's'} verified`;

  const kpiCards = [
    {
      tone: 'orange' as const,
      value: cvScore,
      label: 'CV / ATS Score',
      trend: cvScore > 0 ? 'From your latest CV analysis' : 'Upload a CV on Analyze to score',
    },
    {
      tone: 'teal' as const,
      value: githubScore,
      label: 'GitHub Score',
      trend: githubScore > 0 ? 'From your latest GitHub analysis' : 'Connect GitHub on Analyze to score',
    },
    {
      tone: 'pink' as const,
      value: interviewScore,
      label: 'Interview Score',
      trend: interviewScore > 0 ? 'Average of your last 3 mock interviews' : 'Complete a mock interview to score',
    },
    {
      tone: 'blue' as const,
      value: verificationScore,
      label: 'Verification Score',
      trend: skillGaps > 0
        ? `${skillGaps} skill gap${skillGaps === 1 ? '' : 's'} · ${verificationTrend}`
        : verificationTrend,
    },
  ];

  return (
    <div className="analytics-dash">
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
          <h2 className="analytics-card__title">Overall Readiness</h2>
          <p className="analytics-card__subtitle">Composite career readiness score</p>
          <p className="analytics-earnings__hint">
            {readinessStatus(overall)}
            {prevOverall != null && prevOverall !== overall && (
              <> · {formatScoreDelta(overall, prevOverall)}</>
            )}
          </p>
          <EarningsGauge value={overall} />
          <p className="analytics-earnings__value">{overall}%</p>
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
            {scoreRows.map((row) => (
              <div key={row.id} className="analytics-table__row">
                <span className="analytics-table__id">{row.id}</span>
                <span className="analytics-table__name">{row.name}</span>
                <div
                  className="analytics-table__bar-wrap"
                  style={{
                    '--progress': `${row.progress}%`,
                    '--bar-color': barColors[row.tone],
                  } as CSSProperties}
                  role="progressbar"
                  aria-valuenow={row.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${row.name} progress`}
                />
                <span className={`analytics-table__pill analytics-table__pill--${row.tone}`}>{row.score}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-card analytics-card--fulfilment">
          <h2 className="analytics-card__title">Readiness Trend</h2>
          <p className="analytics-card__subtitle">Previous period compared with current readiness</p>
          <div className="analytics-fulfilment-body">
            <div className="analytics-chart analytics-chart--fulfilment">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          </div>
        </section>

        <section className="analytics-card analytics-card--earnings">
          <h2 className="analytics-card__title">Score vs Target</h2>
          <p className="analytics-card__subtitle">Current performance against job-ready benchmark</p>
          <div className="analytics-chart analytics-chart--level">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barGap={4} barCategoryGap="28%">
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#7aaea9', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
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
