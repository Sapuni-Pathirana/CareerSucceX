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
  return (
    <section className="dash-verified-section">
      <div className="dash-verified-section__glow" aria-hidden />

      <div className="relative z-10 mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white sm:text-lg">Verified AI Tests</h2>
          <p className="mt-1 text-sm text-[#a099c0]">
            Scroll to view each skill you have verified with an AI quiz
          </p>
        </div>
        {badges.length > 1 && (
          <p className="shrink-0 text-xs text-[#8b83a8]">Scroll to see more</p>
        )}
      </div>

      <div className="dash-verified-scroll" tabIndex={0} role="region" aria-label="Verified AI tests">
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

            <div className="relative z-10 min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white sm:text-base">{badge.skillName}</p>
              <p className="mt-0.5 text-xs text-[#a099c0] sm:text-sm">
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
