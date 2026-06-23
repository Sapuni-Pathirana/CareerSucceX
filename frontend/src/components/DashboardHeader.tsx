import ScoreGauge from './ScoreGauge';

type DashboardHeaderProps = {
  firstName: string;
  overall: number;
  statusLabel: string;
  statusPill: string;
  updatedAt?: string;
};

export default function DashboardHeader({
  firstName,
  overall,
  statusLabel,
  statusPill,
  updatedAt,
}: DashboardHeaderProps) {
  return (
    <section className="dash-modern-header">
      <div className="dash-modern-header__copy">
        <p className="dash-modern-header__eyebrow">Dashboard overview</p>
        <h1 className="dash-modern-header__title">Welcome back, {firstName}</h1>
        <p className="dash-modern-header__subtitle">
          Track readiness across CV, GitHub, interviews, and verified skills.
        </p>
        <div className="dash-modern-header__meta">
          <span className={`dash-modern-header__status ${statusPill}`}>{statusLabel}</span>
          {updatedAt && (
            <span className="dash-modern-header__updated">
              Updated {new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <div className="dash-modern-header__score">
        <ScoreGauge score={overall} size={128} theme="dark" variant="hero" />
        <p className="dash-modern-header__score-label">Overall readiness</p>
      </div>
    </section>
  );
}
