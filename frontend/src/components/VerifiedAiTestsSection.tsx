import { useRef } from 'react';
import type { VerificationBadge } from '../types';

type VerifiedAiTestsSectionProps = {
  badges: VerificationBadge[];
};

function formatVerifiedDate(iso?: string) {
  if (!iso) return 'Recently verified';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function VerifiedAiTestsSection({ badges }: VerifiedAiTestsSectionProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollCards = (direction: 'left' | 'right') => {
    const rail = scrollRef.current;
    if (!rail) return;

    const firstCard = rail.querySelector<HTMLElement>('.dash-verified-item');
    const gap = 16;
    const step = (firstCard?.offsetWidth ?? 192) + gap;

    rail.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  return (
    <section className="dash-verified-section">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white sm:text-lg">Verified AI Tests</h2>
          <p className="mt-1 text-sm text-[#7aaea9]">
            Scroll to view each skill you have verified with an AI quiz
          </p>
        </div>
        {badges.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="dash-verified-nav"
              onClick={() => scrollCards('left')}
              aria-label="Scroll verified cards left"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path
                  d="M11.5 5.5 7 10l4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="dash-verified-nav"
              onClick={() => scrollCards('right')}
              aria-label="Scroll verified cards right"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path
                  d="M8.5 5.5 13 10l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="dash-verified-scroll"
        tabIndex={0}
        role="region"
        aria-label="Verified AI tests"
      >
        {badges.map((badge) => (
          <article
            key={badge.skillId}
            className="dash-verified-item"
            aria-label={`${badge.skillName} verified`}
          >
            <div className="dash-verified-item__icon" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path
                  d="M9 12.5 11 14.5 15.5 9.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>

            <div className="dash-verified-item__content">
              <p className="dash-verified-item__title">{badge.skillName}</p>
              <p className="dash-verified-item__date">
                Verified on {formatVerifiedDate(badge.verifiedAt)}
              </p>
            </div>

            <span className="dash-verified-item__badge">Verified</span>
          </article>
        ))}
      </div>
    </section>
  );
}
