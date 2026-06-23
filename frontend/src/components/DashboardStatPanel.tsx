import type { ReactNode } from 'react';
import CountUp from './CountUp';

export type DashboardStatItem = {
  icon: ReactNode;
  label: string;
  description?: string;
  value: number;
  delay?: number;
  tone?: 'violet' | 'cyan' | 'emerald' | 'amber';
};

type DashboardStatPanelProps = {
  title?: string;
  subtitle?: string;
  items: DashboardStatItem[];
};

export default function DashboardStatPanel({
  title = 'Performance snapshot',
  subtitle = 'Live scores from your latest assessments',
  items,
}: DashboardStatPanelProps) {
  return (
    <section className="dash-metric-section">
      <div className="dash-metric-section__head">
        <div>
          <h2 className="dash-metric-section__title">{title}</h2>
          <p className="dash-metric-section__subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="dash-metric-grid">
        {items.map((item, i) => (
          <article
            key={i}
            className={`dash-metric-card dash-metric-card--${item.tone ?? 'violet'} animate-fade-in`}
            style={{ animationDelay: `${item.delay ?? i * 70}ms` }}
            aria-label={`${item.label}: ${item.value}`}
          >
            <div className="dash-metric-card__top">
              <div className="dash-metric-card__icon">{item.icon}</div>
            </div>
            <p className="dash-metric-card__label">{item.label}</p>
            <p className="dash-metric-card__value">
              <CountUp target={item.value} />
            </p>
            {item.description && (
              <p className="dash-metric-card__hint">{item.description}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
