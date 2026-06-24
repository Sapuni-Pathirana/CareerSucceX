import { useEffect, useRef, useState } from 'react';
import { cvApi } from '../api/cv';
import { jobsApi } from '../api/jobs';
import { profileApi } from '../api/profile';
import { getErrorMessage } from '../api/client';
import ErrorAlert from './ErrorAlert';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ScoreGauge from './ScoreGauge';
import type { CvAnalysis, CvDocument } from '../types';

export default function CvAnalysisSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<CvDocument[]>([]);
  const [analyses, setAnalyses] = useState<CvAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CvAnalysis | null>(null);
  const [targetRoleId, setTargetRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobStatus, setJobStatus] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [docs, hist, profile] = await Promise.all([
        cvApi.listDocuments(),
        cvApi.listAnalyses(),
        profileApi.get().catch(() => null),
      ]);
      setDocuments(docs);
      setAnalyses(hist);
      if (profile?.targetRoleId) setTargetRoleId(profile.targetRoleId);
      if (hist.length > 0) setSelectedAnalysis(hist[0]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await cvApi.upload(file);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleAnalyze = async (documentId: string) => {
    setAnalyzing(true);
    setError('');
    setJobStatus('Starting analysis...');
    try {
      const job = await cvApi.analyze(documentId, targetRoleId || undefined);
      setJobStatus('Processing...');
      const result = await jobsApi.pollUntilComplete(job.jobId, (s) =>
        setJobStatus(`Status: ${s.status}`),
      );
      if (result.status === 'FAILED') {
        throw new Error(result.errorMessage || 'Analysis failed');
      }
      const analysis = await cvApi.getAnalysis(job.analysisId);
      setSelectedAnalysis(analysis);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAnalyzing(false);
      setJobStatus('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this CV document?')) return;
    try {
      await cvApi.deleteDocument(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Upload your CV and get ATS scoring with improvement suggestions
        </p>
        <label className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700">
          {uploading ? 'Uploading...' : 'Upload CV'}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}
      {analyzing && jobStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <LoadingSpinner size="sm" />
          {jobStatus}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-900">Your Documents</h3>
          {documents.length === 0 ? (
            <EmptyState title="No CV uploaded" description="Upload a PDF or DOCX to get started" />
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{doc.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {(doc.fileSizeBytes / 1024).toFixed(1)} KB · {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-2 flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAnalyze(doc.id)}
                      disabled={analyzing}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      Analyze
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 className="pt-4 text-lg font-semibold text-slate-900">Analysis History</h3>
          {analyses.length === 0 ? (
            <p className="text-sm text-slate-500">No analyses yet</p>
          ) : (
            <ul className="space-y-2">
              {analyses.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedAnalysis(a)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                      selectedAnalysis?.id === a.id
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-medium">ATS {Math.round(Number(a.atsScore))}</span>
                    <span className="ml-2 text-slate-500">
                      {new Date(a.analyzedAt).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedAnalysis ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <ScoreGauge score={Number(selectedAnalysis.atsScore)} label="ATS Score" />
                <div className="grid flex-1 grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round(Number(selectedAnalysis.breakdown.keywordScore))}
                    </p>
                    <p className="text-xs text-slate-500">Keywords</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round(Number(selectedAnalysis.breakdown.formatScore))}
                    </p>
                    <p className="text-xs text-slate-500">Format</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round(Number(selectedAnalysis.breakdown.completenessScore))}
                    </p>
                    <p className="text-xs text-slate-500">Completeness</p>
                  </div>
                </div>
              </div>

              {selectedAnalysis.keywordReport && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {Object.entries(selectedAnalysis.keywordReport).map(([key, values]) => (
                    <div key={key}>
                      <h4 className="mb-2 text-sm font-semibold capitalize text-slate-900">{key}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(values as string[]).map((v) => (
                          <span
                            key={v}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              key.toLowerCase().includes('miss')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedAnalysis.suggestions?.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">Suggestions</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    {selectedAnalysis.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No analysis selected"
              description="Upload and analyze your CV to see detailed results"
            />
          )}
        </div>
      </div>
    </div>
  );
}
