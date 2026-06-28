import { useEffect, useRef } from 'react';
import CountUp from './CountUp';
import ScoreGauge from './ScoreGauge';
import RecommendationList, { buildReportSummary, formatBriefFitSummary, normalizeRecommendations } from './RecommendationList';
import type { GitHubAnalysis } from '../types';

type GitHubAnalysisResultsProps = {
  analysis: GitHubAnalysis;
};

function sortLanguages(stats: Record<string, unknown>) {
  return Object.entries(stats)
    .map(([name, value]) => ({
      name,
      pct: typeof value === 'number' ? value : Number(value) || 0,
    }))
    .sort((a, b) => b.pct - a.pct);
}

export default function GitHubAnalysisResults({ analysis }: GitHubAnalysisResultsProps) {
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

  const metrics = [
    { label: 'Activity', value: Math.round(Number(analysis.activityScore)) },
    { label: 'README', value: Math.round(Number(analysis.readmeScore)) },
    { label: 'Diversity', value: Math.round(Number(analysis.diversityScore)) },
  ];

  const languages = analysis.languageStats ? sortLanguages(analysis.languageStats) : [];
  const repoStats = analysis.repoStats ?? {};
  const portfolioTags: string[] = [];
  if (repoStats.count != null) portfolioTags.push(`${repoStats.count} repos`);
  if (repoStats.stars != null) portfolioTags.push(`${repoStats.stars} stars`);
  if (repoStats.languages != null) portfolioTags.push(`${repoStats.languages} languages`);

  const recommendations = normalizeRecommendations(
    analysis.recommendationItems,
    analysis.recommendations,
  );

  let tagIndex = 0;

  return (
    <div ref={panelRef} className="cv-results-panel analytics-panel">
      <div className="cv-results-top cv-results-animate" style={{ animationDelay: '0.05s' }}>
        <ScoreGauge
          key={analysis.id}
          score={Number(analysis.overallScore)}
          label="Overall Score"
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

          {(analysis.roleAlignmentSummary || analysis.roleAlignmentScore != null) && (
            <div className="cv-results-row cv-results-animate mb-2" style={{ animationDelay: '0.14s' }}>
              <span className="cv-results-row__label">Role alignment</span>
              <div className="cv-results-row__content">
                {analysis.roleAlignmentScore != null && (
                  <span className="cv-results-row__content-score">
                    {Math.round(Number(analysis.roleAlignmentScore))}/100
                  </span>
                )}
                {formatBriefFitSummary(analysis.roleAlignmentSummary)}
              </div>
            </div>
          )}

          {portfolioTags.length > 0 && (
            <div className="cv-results-row cv-results-animate" style={{ animationDelay: '0.18s' }}>
              <span className="cv-results-row__label">Portfolio</span>
              <div className="cv-results-tags">
                {portfolioTags.map((tag) => {
                  const delay = 0.24 + tagIndex * 0.04;
                  tagIndex += 1;
                  return (
                    <span
                      key={tag}
                      className="analytics-tag cv-results-tag cv-results-animate analytics-tag--success"
                      style={{ animationDelay: `${delay}s` }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div className="cv-results-row cv-results-animate" style={{ animationDelay: '0.24s' }}>
              <span className="cv-results-row__label">Languages</span>
              <div className="cv-results-tags">
                {languages.map(({ name, pct }) => {
                  const delay = 0.28 + tagIndex * 0.04;
                  tagIndex += 1;
                  return (
                    <span
                      key={name}
                      className="analytics-tag cv-results-tag cv-results-animate analytics-tag--success"
                      style={{ animationDelay: `${delay}s` }}
                    >
                      {name} {Math.round(pct)}%
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <RecommendationList
            summaryText={analysis.summaryText}
            summaryTips={analysis.summaryTips}
            items={recommendations}
            label="Summary"
            reportContext={{
              title: 'GitHub Analysis Report',
              targetRole: analysis.targetRoleTitle,
              analyzedAt: analysis.analyzedAt,
              summary: buildReportSummary(
                analysis.reportSummary,
                analysis.summaryText,
                analysis.roleAlignmentSummary,
                recommendations,
              ),
              scores: {
                'Overall Score': Math.round(Number(analysis.overallScore)),
                ...(analysis.roleAlignmentScore != null
                  ? { 'Role Alignment': Math.round(Number(analysis.roleAlignmentScore)) }
                  : {}),
                Activity: Math.round(Number(analysis.activityScore)),
                README: Math.round(Number(analysis.readmeScore)),
                Diversity: Math.round(Number(analysis.diversityScore)),
              },
            }}
          />

          <p className="cv-results-animate text-xs text-[#7aaea9]" style={{ animationDelay: '0.45s' }}>
            Analyzed {new Date(analysis.analyzedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
