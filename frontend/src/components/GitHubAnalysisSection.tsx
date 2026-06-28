import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { githubApi } from '../api/github';
import { jobsApi } from '../api/jobs';
import { getErrorMessage } from '../api/client';
import ErrorAlert from './ErrorAlert';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import GitHubAnalysisResults from './GitHubAnalysisResults';
import ConfirmDialog from './ConfirmDialog';
import type { GitHubAnalysis, GitHubConnectionStatus } from '../types';

export default function GitHubAnalysisSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<GitHubConnectionStatus | null>(null);
  const [analyses, setAnalyses] = useState<GitHubAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<GitHubAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobStatus, setJobStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const conn = await githubApi.getStatus();
      setStatus(conn);
      if (conn.connected) {
        const hist = await githubApi.listAnalyses();
        setAnalyses(hist);
        setSelectedAnalysis((current) => {
          if (current) {
            const match = hist.find((a) => a.id === current.id);
            if (match) return match;
          }
          return null;
        });
      } else {
        setAnalyses([]);
        setSelectedAnalysis(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const oauthReady = status?.oauthConfigured !== false;
  const connected = status?.connected === true;
  const username = status?.username;

  const handleConnect = async () => {
    setError('');
    if (!oauthReady) return;
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
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
      setJobStatus('');
    }
  };

  const confirmDisconnect = async () => {
    setDisconnecting(true);
    setError('');
    try {
      await githubApi.disconnect();
      setStatus({ connected: false, oauthConfigured: status?.oauthConfigured });
      setAnalyses([]);
      setSelectedAnalysis(null);
      setDisconnectOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-dash--loading py-12">
        <LoadingSpinner size="lg" label="Loading GitHub status…" />
      </div>
    );
  }

  const headerSubtitle = connected
    ? username
      ? `Connected as @${username}${
          status?.lastSyncedAt
            ? ` · Last synced ${new Date(status.lastSyncedAt).toLocaleString()}`
            : ''
        }`
      : 'Portfolio strength from your repositories, README quality, and activity'
    : oauthReady
      ? 'Connect your GitHub account to analyze repositories, README quality, and activity'
      : 'GitHub OAuth is not configured on this server';

  return (
    <div>
      <div className="analytics-card__head analytics-card__head--row">
        <div>
          <h2 className="analytics-card__title">GitHub Analysis</h2>
          <p className="analytics-card__subtitle">{headerSubtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 analytics-card__actions">
          {connected ? (
            <>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="btn-aurora analytics-btn-interactive rounded-lg px-4 py-2 text-sm disabled:opacity-60"
              >
                {analyzing ? 'Analyzing...' : 'Run Analysis'}
              </button>
              <button
                type="button"
                onClick={() => setDisconnectOpen(true)}
                className="analytics-btn-ghost rounded-lg px-4 py-2 text-sm"
              >
                Disconnect
              </button>
            </>
          ) : oauthReady ? (
            <button
              type="button"
              onClick={handleConnect}
              className="btn-aurora analytics-btn-interactive rounded-lg px-4 py-2 text-sm"
            >
              Connect GitHub
            </button>
          ) : null}
        </div>
      </div>

      {error && oauthReady && (
        <div className="mb-4">
          <ErrorAlert message={error} theme="dark" />
        </div>
      )}
      {success && (
        <div className="analytics-banner analytics-banner--success mb-4">{success}</div>
      )}
      {analyzing && jobStatus && (
        <div className="analytics-banner analytics-banner--info mb-4">
          <LoadingSpinner size="sm" />
          {jobStatus}
        </div>
      )}

      {!connected ? (
        <EmptyState
          theme="dark"
          title={oauthReady ? 'GitHub not connected' : 'GitHub connect unavailable'}
          description={
            oauthReady
              ? 'Each user connects their own GitHub account. Once connected, run an analysis to see portfolio scores and tips.'
              : 'An administrator must set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_REDIRECT_URI so users can connect their own accounts.'
          }
          action={
            oauthReady ? (
              <button type="button" onClick={handleConnect} className="btn-aurora rounded-lg px-4 py-2 text-sm">
                Connect GitHub
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="cv-analysis-grid">
          <aside className="cv-analysis-sidebar">
            <h3 className="analytics-analyze-section-title">Analysis History</h3>
            {analyses.length === 0 ? (
              <div className="cv-analysis-sidebar__empty">
                <EmptyState
                  size="compact"
                  theme="dark"
                  title="No analyses yet"
                  description="Run your first GitHub analysis to see portfolio scores"
                />
              </div>
            ) : (
              <ul className="cv-history-list mt-3 space-y-2">
                {analyses.map((a) => (
                  <li
                    key={a.id}
                    className={`cv-history-item cv-history-item--no-actions ${
                      selectedAnalysis?.id === a.id ? 'cv-history-item--active' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAnalysis(a)}
                      className="cv-history-item__body"
                    >
                      <span className="cv-history-item__score">
                        Score {Math.round(Number(a.overallScore))}
                      </span>
                      <span className="cv-history-item__filename" title={username ? `@${username}` : 'GitHub'}>
                        {username ? `@${username}` : 'GitHub'}
                      </span>
                      <span className="cv-history-item__date">
                        {new Date(a.analyzedAt).toLocaleDateString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="cv-analysis-main">
            {selectedAnalysis ? (
              <GitHubAnalysisResults key={selectedAnalysis.id} analysis={selectedAnalysis} />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4 sm:p-6">
                <EmptyState
                  theme="dark"
                  title="No analysis selected"
                  description="Run an analysis or select an entry from history"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={disconnectOpen}
        title="Disconnect GitHub?"
        description="Your GitHub connection will be removed. Past analyses stay in history until you reconnect and run new ones."
        confirmLabel="Disconnect"
        cancelLabel="Keep connected"
        loading={disconnecting}
        onConfirm={() => void confirmDisconnect()}
        onCancel={() => !disconnecting && setDisconnectOpen(false)}
      />
    </div>
  );
}
