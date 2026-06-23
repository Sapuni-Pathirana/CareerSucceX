import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { readinessApi } from '../api/readiness';
import { useAuth } from '../context/AuthContext';

export default function DashboardHeaderActions() {
  const { user } = useAuth();
  const [hasRecs, setHasRecs] = useState(false);

  useEffect(() => {
    readinessApi.getRecommendations()
      .then((recs) => setHasRecs(recs.length > 0))
      .catch(() => setHasRecs(false));
  }, []);

  const initials = user?.profile?.fullName?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const firstName = user?.profile?.fullName?.split(' ')[0] || 'there';

  return (
    <>
      <button type="button" className="analytics-icon-btn" aria-label="Notifications">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
          <path d="M12 4.5a5 5 0 0 1 5 5v2.2c0 .5.2 1 .5 1.4l.7.9a1 1 0 0 1-.8 1.6H6.6a1 1 0 0 1-.8-1.6l.7-.9c.3-.4.5-.9.5-1.4V9.5a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {hasRecs && <span className="analytics-icon-btn__dot" />}
      </button>
      <Link to="/profile" className="analytics-profile" aria-label="Profile">
        <span className="analytics-profile__avatar">{initials}</span>
        <span className="hidden whitespace-nowrap text-sm font-medium sm:inline">{firstName}</span>
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#7aaea9]" fill="none" aria-hidden>
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </>
  );
}
