import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { githubApi } from '../api/github';
import { jobsApi } from '../api/jobs';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import ScoreGauge from '../components/ScoreGauge';
import type { GitHubAnalysis, GitHubConnectionStatus } from '../types';

export default function GitHubAnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<GitHubConnectionStatus | null>(null);
  const [analysis, setAnalysis] = useState<GitHubAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobStatus, setJobStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const conn = await githubApi.getStatus();
      setStatus(conn);
      if (conn.connected) {
        try {
          const latest = await githubApi.getLatestAnalysis();
          setAnalysis(latest);
        } catch {
          setAnalysis(null);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setSuccess('GitHub connected successfully!');
      searchParams.delete('connected');
      setSearchParams(searchParams, { replace: true });
    }
    load();
  }, []);

  const handleConnect = async () => {
    setError('');
    try {
      await githubApi.connect();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    setJobStatus('Starting analysis...');
    try {
      const job = await githubApi.analyze();
      const result = await jobsApi.pollUntilComplete(job.jobId, (s) =>
        setJobStatus(`Status: ${s.status}`),
      );
      if (result.status === 'FAILED') {
        throw new Error(result.errorMessage || 'Analysis failed');
      }
      const latest = await githubApi.getLatestAnalysis();
      setAnalysis(latest);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
      setJobStatus('');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your GitHub account?')) return;
    try {
      await githubApi.disconnect();
      setStatus({ connected: false });
      setAnalysis(null);
    } catch (err) {
      setError(getErrorMessage(err));
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
        title="GitHub Analysis"
        description="Connect your GitHub to analyze your portfolio and coding activity"
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}
      {analyzing && jobStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <LoadingSpinner size="sm" />
          {jobStatus}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {status?.connected ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Connected as</p>
              <p className="text-lg font-semibold text-slate-900">@{status.username}</p>
              {status.lastSyncedAt && (
                <p className="text-xs text-slate-500">
                  Last synced {new Date(status.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {analyzing ? 'Analyzing...' : 'Run Analysis'}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="GitHub not connected"
            description="Connect your GitHub account to analyze your repositories and activity"
            action={
              <button
                type="button"
                onClick={handleConnect}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Connect GitHub
              </button>
            }
          />
        )}
      </div>

      {analysis && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ScoreGauge score={Number(analysis.overallScore)} label="Overall Score" />
            <div className="grid flex-1 grid-cols-3 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {Math.round(Number(analysis.activityScore))}
                </p>
                <p className="text-xs text-slate-500">Activity</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {Math.round(Number(analysis.readmeScore))}
                </p>
                <p className="text-xs text-slate-500">README</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {Math.round(Number(analysis.diversityScore))}
                </p>
                <p className="text-xs text-slate-500">Diversity</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Analyzed {new Date(analysis.analyzedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
