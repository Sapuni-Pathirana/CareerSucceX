import type { ReactNode } from 'react';
import CountUp from './CountUp';

export type DashboardStatItem = {
  icon: ReactNode;
  label: string;
  description?: string;
  value: number;
  delay?: number;
};

type DashboardStatPanelProps = {
  title?: string;
  items: DashboardStatItem[];
};

export default function DashboardStatPanel({
  title = 'Your scores at a glance:',
  items,
}: DashboardStatPanelProps) {
  return (
    <div className="dash-stat-panel">
      <div className="dash-stat-panel__glow" aria-hidden />
      <h2 className="dash-stat-panel__title">{title}</h2>
      <div className="dash-stat-panel__grid">
        {items.map((item, i) => (
          <article
            key={i}
            className="dash-stat-card animate-fade-in"
            style={{ animationDelay: `${item.delay ?? i * 70}ms` }}
            aria-label={`${item.label}: ${item.value}`}
          >
            <div className="dash-stat-card__icon">{item.icon}</div>
            <p className="dash-stat-card__label">{item.label}</p>
            {item.description && (
              <p className="dash-stat-card__description">{item.description}</p>
            )}
            <p className="dash-stat-card__score">
              <CountUp target={item.value} />
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
