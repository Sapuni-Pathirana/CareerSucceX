import { useEffect, useRef } from 'react';
import CountUp from './CountUp';
import ScoreGauge from './ScoreGauge';
import RecommendationList, { buildReportSummary, formatBriefFitSummary, normalizeRecommendations } from './RecommendationList';
import type { CvAnalysis } from '../types';

type CvAnalysisResultsProps = {
  analysis: CvAnalysis;
};

function formatKeywordLabel(key: string) {
  const lower = key.toLowerCase();
  if (lower.includes('match') && !lower.includes('miss')) return 'Matched';
  if (lower.includes('miss')) return 'Missing';
  return key.replace(/_/g, ' ');
}

function sortKeywordEntries(report: Record<string, string[]>) {
  return Object.entries(report).sort(([a], [b]) => {
    const aMiss = a.toLowerCase().includes('miss');
    const bMiss = b.toLowerCase().includes('miss');
    if (aMiss === bMiss) return 0;
    return aMiss ? 1 : -1;
  });
}

export default function CvAnalysisResults({ analysis }: CvAnalysisResultsProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    el.classList.remove('cv-results-panel--visible');
    const id = requestAnimationFrame(() => {
      el.classList.add('cv-results-panel--visible');
    });
    return () => cancelAnimationFrame(id);
  }, [analysis.id]);

  const keywordEntries = analysis.keywordReport
    ? sortKeywordEntries(analysis.keywordReport).filter(
        ([key]) => !['roleFitScore', 'roleFitSummary'].includes(key),
      )
    : [];

  const recommendations = normalizeRecommendations(
    analysis.recommendations,
    analysis.suggestions,
  );

  const metrics = [
    { label: 'Keywords', value: Math.round(Number(analysis.breakdown.keywordScore)) },
    { label: 'Format', value: Math.round(Number(analysis.breakdown.formatScore)) },
    { label: 'Completeness', value: Math.round(Number(analysis.breakdown.completenessScore)) },
  ];

  let tagIndex = 0;

  return (
    <div ref={panelRef} className="cv-results-panel analytics-panel">
      <div className="cv-results-top cv-results-animate" style={{ animationDelay: '0.05s' }}>
        <ScoreGauge
          key={analysis.id}
          score={Number(analysis.atsScore)}
          label="ATS Score"
          theme="dark"
          size={100}
        />

        <div className="cv-results-body">
          <div className="cv-results-mini-stats cv-results-animate" style={{ animationDelay: '0.1s' }}>
            {metrics.map((metric, i) => (
              <div key={metric.label} className="cv-results-mini-stat">
                <span className="cv-results-mini-stat__value">
                  <CountUp key={`${analysis.id}-${metric.label}`} target={metric.value} />
                </span>
                <span className="cv-results-mini-stat__label">{metric.label}</span>
                {i < metrics.length - 1 && <span className="cv-results-mini-stat__sep" aria-hidden />}
              </div>
            ))}
          </div>

          {(analysis.roleFitSummary || analysis.roleFitScore != null) && (
            <div className="cv-results-row cv-results-animate mb-2" style={{ animationDelay: '0.14s' }}>
              <span className="cv-results-row__label">Role fit</span>
              <div className="cv-results-row__content">
                {analysis.roleFitScore != null && (
                  <span className="cv-results-row__content-score">
                    {Math.round(Number(analysis.roleFitScore))}/100
                  </span>
                )}
                {formatBriefFitSummary(analysis.roleFitSummary)}
              </div>
            </div>
          )}

          {keywordEntries.map(([key, values], sectionIndex) => {
            const isMissing = key.toLowerCase().includes('miss');
            return (
              <div
                key={key}
                className="cv-results-row cv-results-animate"
                style={{ animationDelay: `${0.18 + sectionIndex * 0.06}s` }}
              >
                <span className="cv-results-row__label">{formatKeywordLabel(key)}</span>
                <div className="cv-results-tags">
                  {(values as string[]).map((v) => {
                    const delay = 0.24 + tagIndex * 0.04;
                    tagIndex += 1;
                    return (
                      <span
                        key={v}
                        className={`analytics-tag cv-results-tag cv-results-animate ${
                          isMissing ? 'analytics-tag--warn' : 'analytics-tag--success'
                        }`}
                        style={{ animationDelay: `${delay}s` }}
                      >
                        {v}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <RecommendationList
            summaryText={analysis.summaryText}
            summaryTips={analysis.summaryTips}
            items={recommendations}
            label="Summary"
            reportContext={{
              title: 'CV Analysis Report',
              targetRole: analysis.targetRoleTitle,
              analyzedAt: analysis.analyzedAt,
              summary: buildReportSummary(
                analysis.reportSummary,
                analysis.summaryText,
                analysis.roleFitSummary,
                recommendations,
              ),
              scores: {
                'ATS Score': Math.round(Number(analysis.atsScore)),
                ...(analysis.roleFitScore != null
                  ? { 'Role Fit': Math.round(Number(analysis.roleFitScore)) }
                  : {}),
                Keywords: Math.round(Number(analysis.breakdown.keywordScore)),
                Format: Math.round(Number(analysis.breakdown.formatScore)),
                Completeness: Math.round(Number(analysis.breakdown.completenessScore)),
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
