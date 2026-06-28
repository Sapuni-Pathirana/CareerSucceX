import { useState } from 'react';
import type { RecommendationItem } from '../types';
import JustificationReportModal, {
  type AnalysisReportContext,
} from './JustificationReportModal';

type RecommendationListProps = {
  summaryText?: string;
  summaryTips?: string[];
  items: RecommendationItem[];
  label?: string;
  reportContext?: AnalysisReportContext;
};

export function normalizeRecommendations(
  items?: RecommendationItem[],
  fallbackTexts?: string[],
): RecommendationItem[] {
  if (items && items.length > 0) {
    return items;
  }
  return (fallbackTexts ?? []).map((text) => ({ text, priority: 'medium' }));
}

/** Short teaser for results panel; full detail lives in the report modal. */
export function formatBriefSummary(text: string | undefined, maxSentences = 2): string {
  if (!text?.trim()) return '';
  const trimmed = text.trim();
  const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [trimmed];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

export function buildReportSummary(
  reportSummary: string | undefined,
  summaryText: string | undefined,
  fitSummary: string | undefined,
  items: RecommendationItem[],
): string {
  if (reportSummary?.trim()) return reportSummary.trim();

  const parts: string[] = [];
  if (fitSummary?.trim()) parts.push(fitSummary.trim());
  if (summaryText?.trim()) parts.push(summaryText.trim());

  const themes = items
    .map((item) => item.text.trim())
    .filter(Boolean)
    .filter((text, index, list) => list.indexOf(text) === index)
    .slice(0, 4);

  if (themes.length > 0) {
    parts.push(`Priority improvements include: ${themes.join('; ')}.`);
  }

  return parts.join(' ').trim();
}

export function formatBriefFitSummary(text: string | undefined): string {
  return formatBriefSummary(text, 1);
}

function buildSummaryParagraph(
  summaryText: string | undefined,
  summaryTips: string[] | undefined,
  items: RecommendationItem[],
): string {
  if (summaryText?.trim()) {
    return formatBriefSummary(summaryText.trim(), 2);
  }
  if (summaryTips && summaryTips.length > 0) {
    return formatBriefSummary(summaryTips.join(' '), 2);
  }
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const item of items) {
    const key = item.text.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    parts.push(item.text);
    if (parts.length >= 2) break;
  }
  return formatBriefSummary(parts.join(' '), 2);
}

export default function RecommendationList({
  summaryText,
  summaryTips,
  items,
  label = 'Summary',
  reportContext,
}: RecommendationListProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const summaryParagraph = buildSummaryParagraph(summaryText, summaryTips, items);
  if (!summaryParagraph && !items.length) return null;

  const context: AnalysisReportContext = reportContext ?? {
    title: 'Analysis report',
  };

  return (
    <>
      <div className="cv-results-row cv-results-animate" style={{ animationDelay: '0.35s' }}>
        <span className="cv-results-row__label">{label}</span>
        <div>
          {summaryParagraph ? (
            <p className="cv-results-row__content">{summaryParagraph}</p>
          ) : null}
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-3 text-xs font-medium text-[#7dd3c7] transition-colors hover:text-white"
            >
              View full analyzed report
            </button>
          ) : null}
        </div>
      </div>

      <JustificationReportModal
        open={modalOpen}
        context={context}
        items={items}
        focusIndex={null}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
