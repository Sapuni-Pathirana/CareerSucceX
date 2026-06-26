import { useEffect, useRef, useState } from 'react';
import { cvApi } from '../api/cv';
import { jobsApi } from '../api/jobs';
import { profileApi } from '../api/profile';
import { getErrorMessage } from '../api/client';
import ErrorAlert from './ErrorAlert';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import CvAnalysisResults from './CvAnalysisResults';
import CvDocumentPreview from './CvDocumentPreview';
import ConfirmDialog from './ConfirmDialog';
import type { CvAnalysis, CvDocument } from '../types';

function EyeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TrashIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function enrichAnalysis(analysis: CvAnalysis, documents: CvDocument[]): CvAnalysis {
  let documentId = analysis.documentId;
  let fileName = analysis.fileName;

  if (documentId && !fileName) {
    fileName = documents.find((doc) => doc.id === documentId)?.fileName;
  }

  if (!documentId && fileName) {
    const matches = documents.filter((doc) => doc.fileName === fileName);
    if (matches.length === 1) documentId = matches[0].id;
  }

  if (!documentId && documents.length === 1) {
    documentId = documents[0].id;
    fileName = fileName ?? documents[0].fileName;
  }

  return {
    ...analysis,
    documentId,
    fileName,
  };
}

export default function CvAnalysisSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyses, setAnalyses] = useState<CvAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CvAnalysis | null>(null);
  const [targetRoleId, setTargetRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobStatus, setJobStatus] = useState('');
  const [error, setError] = useState('');
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    fileName: string;
    isPdf: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    analysis: CvAnalysis;
    documentId: string;
    fileName: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const closePreview = () => {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [hist, docs, profile] = await Promise.all([
        cvApi.listAnalyses(),
        cvApi.listDocuments().catch(() => [] as CvDocument[]),
        profileApi.get().catch(() => null),
      ]);
      const enriched = hist.map((analysis) => enrichAnalysis(analysis, docs));
      setAnalyses(enriched);
      if (profile?.targetRoleId) setTargetRoleId(profile.targetRoleId);
      setSelectedAnalysis((current) => {
        if (current) {
          const match = enriched.find((a) => a.id === current.id);
          if (match) return match;
        }
        return enriched[0] ?? null;
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { documentId } = await cvApi.upload(file);
      await handleAnalyze(documentId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleView = async (documentId: string | undefined, fileName: string) => {
    if (!documentId) {
      setError('Document not found for this analysis.');
      return;
    }

    setError('');
    setViewingDocumentId(documentId);
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });

    try {
      const file = await cvApi.fetchDocument(documentId);
      setPreview({
        url: file.url,
        fileName: file.fileName || fileName,
        isPdf: file.contentType.includes('pdf'),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setViewingDocumentId(null);
    }
  };

  const requestDelete = (
    analysis: CvAnalysis,
    documentId: string | undefined,
    fileName: string,
  ) => {
    if (!documentId) {
      setError('Document not found for this analysis.');
      return;
    }
    setDeleteTarget({ analysis, documentId, fileName });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await cvApi.deleteDocument(deleteTarget.documentId);
      setSelectedAnalysis((current) =>
        current?.id === deleteTarget.analysis.id ? null : current,
      );
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-dash--loading py-12">
        <LoadingSpinner size="lg" label="Loading CV data…" />
      </div>
    );
  }

  return (
    <div>
      <div className="analytics-card__head analytics-card__head--row">
        <div>
          <h2 className="analytics-card__title">CV Analysis</h2>
          <p className="analytics-card__subtitle">
            Upload your CV and get ATS scoring with improvement suggestions
          </p>
        </div>
        <label className="btn-aurora analytics-btn-interactive shrink-0 cursor-pointer px-4 py-2 text-center text-sm">
          {uploading || analyzing ? 'Processing...' : 'Upload CV'}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading || analyzing}
          />
        </label>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} theme="dark" />
        </div>
      )}
      {analyzing && jobStatus && (
        <div className="analytics-banner analytics-banner--info mb-4">
          <LoadingSpinner size="sm" />
          {jobStatus}
        </div>
      )}

      <div className="cv-analysis-grid">
        <aside className="cv-analysis-sidebar">
          <h3 className="analytics-analyze-section-title">Analysis History</h3>
          {analyses.length === 0 ? (
            <EmptyState
              theme="dark"
              title="No analyses yet"
              description="Upload a PDF or DOCX to run your first analysis"
            />
          ) : (
            <ul className="cv-history-list mt-3 space-y-2">
              {analyses.map((a) => {
                const documentId = a.documentId;
                const fileName = a.fileName ?? 'CV document';

                return (
                  <li
                    key={a.id}
                    className={`cv-history-item ${
                      selectedAnalysis?.id === a.id ? 'cv-history-item--active' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAnalysis(a)}
                      className="cv-history-item__body"
                    >
                      <span className="cv-history-item__score">
                        ATS {Math.round(Number(a.atsScore))}
                      </span>
                      <span className="cv-history-item__filename" title={fileName}>
                        {fileName}
                      </span>
                      <span className="cv-history-item__date">
                        {new Date(a.analyzedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <div className="cv-history-item__actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleView(documentId, fileName);
                        }}
                        disabled={viewingDocumentId === documentId}
                        className="analytics-icon-btn cv-history-icon-btn"
                        aria-label={`View ${fileName}`}
                        title="View document"
                      >
                        {viewingDocumentId === documentId ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <EyeIcon />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(a, documentId, fileName);
                        }}
                        className="analytics-icon-btn cv-history-icon-btn cv-history-icon-btn--danger"
                        aria-label={`Delete ${fileName}`}
                        title="Delete document"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="cv-analysis-main">
          {selectedAnalysis ? (
            <CvAnalysisResults key={selectedAnalysis.id} analysis={selectedAnalysis} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                theme="dark"
                title="No analysis selected"
                description="Upload a CV or select an entry from analysis history"
              />
            </div>
          )}
        </div>
      </div>

      {preview && (
        <CvDocumentPreview
          fileName={preview.fileName}
          url={preview.url}
          isPdf={preview.isPdf}
          onClose={closePreview}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete CV document?"
        description={
          deleteTarget
            ? `"${deleteTarget.fileName}" and its analysis will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Keep document"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
