import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { interviewsApi } from '../api/interviews';
import { profileApi } from '../api/profile';
import { rolesApi } from '../api/roles';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import type { Difficulty, InterviewSession, InterviewType, TargetRole } from '../types';

export default function MockInterviewsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('MIXED');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, r, profile] = await Promise.all([
          interviewsApi.listSessions().catch(() => []),
          rolesApi.list(),
          profileApi.get().catch(() => null),
        ]);
        setSessions(s);
        setRoles(r);
        if (profile?.targetRoleId) setTargetRoleId(profile.targetRoleId);
        else if (r.length > 0) setTargetRoleId(r[0].id);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStart = async () => {
    if (!targetRoleId) {
      setError('Please select a target role');
      return;
    }
    setStarting(true);
    setError('');
    try {
      const session = await interviewsApi.startSession({
        targetRoleId,
        type: interviewType,
        difficulty,
      });
      navigate(`/interviews/${session.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Mock Interviews"
        description="Practice with AI-generated interview questions tailored to your target role"
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Start New Session</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Target role</label>
            <select
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value as InterviewType)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="BEHAVIORAL">Behavioral</option>
              <option value="TECHNICAL">Technical</option>
              <option value="MIXED">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {starting && <LoadingSpinner size="sm" />}
          Start Interview
        </button>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Session History</h2>
      {sessions.length === 0 ? (
        <EmptyState title="No interviews yet" description="Start your first mock interview above" />
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                to={`/interviews/${s.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/30"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {s.targetRoleTitle || s.interviewType} · {s.difficulty}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(s.startedAt).toLocaleString()} · {s.status}
                  </p>
                </div>
                {s.overallScore != null && (
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-700">
                    {Math.round(Number(s.overallScore))}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
