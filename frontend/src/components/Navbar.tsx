import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardHeaderActions from './DashboardHeaderActions';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/analyze', label: 'Analyze' },
  { to: '/interviews', label: 'Interviews' },
  { to: '/skills', label: 'Skills' },
  { to: '/roadmap', label: 'Learning Roadmap' },
];

function isNavActive(pathname: string, to: string) {
  if (to === '/dashboard') return pathname === '/dashboard';
  if (to === '/analyze') {
    return pathname === '/analyze' || pathname === '/cv' || pathname === '/github';
  }
  if (to === '/skills') {
    return pathname === '/skills' || pathname === '/verification' || pathname.startsWith('/verification/');
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function navLinkBase(active: boolean) {
  return `nav-link group ${active ? 'nav-link--active' : ''}`;
}

function NavHighlight({ show }: { show: boolean }) {
  return (
    <span
      className={`nav-link__underline ${show ? 'nav-link__underline--show' : ''}`}
    />
  );
}

function navMetrics(scrollY: number) {
  const range = 360;
  const progress = Math.min(Math.max(scrollY / range, 0), 1);
  const maxRem = 70;
  const minRem = 54;
  return {
    progress,
    maxWidth: maxRem - (maxRem - minRem) * progress,
    linkGap: 2.5 - 1.0 * progress,
    paddingX: 1.5 - 0.375 * progress,
  };
}

const LANDING_NAV_DEFAULTS = navMetrics(0);

function applyLandingNavMetrics(
  y: number,
  shell: HTMLDivElement | null,
  nav: HTMLElement | null,
  links: HTMLDivElement | null,
) {
  const { maxWidth, linkGap, paddingX } = navMetrics(y);
  if (shell) shell.style.maxWidth = `${maxWidth}rem`;
  if (nav) {
    nav.style.paddingLeft = `${paddingX}rem`;
    nav.style.paddingRight = `${paddingX}rem`;
  }
  if (links) links.style.gap = `${linkGap}rem`;
}

function NavLogo({ gradientId, to }: { gradientId: string; to: string }) {
  return (
    <Link to={to} className="nav-logo group flex shrink-0 items-center gap-2">
      <div className="nav-logo-mark">
        <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
          <circle cx="16" cy="16" r="13" stroke={`url(#${gradientId})`} strokeWidth="2.5" fill="none" />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#114852" />
              <stop offset="0.5" stopColor="#008080" />
              <stop offset="1" stopColor="#00B1B1" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute text-[11px] font-black text-[#008080] leading-none">CS</span>
      </div>
      <span className="nav-logo__text">CareerSucceX</span>
    </Link>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const landingShellRef = useRef<HTMLDivElement>(null);
  const landingNavRef = useRef<HTMLElement>(null);
  const landingLinksRef = useRef<HTMLDivElement>(null);

  const isLanding = location.pathname === '/';
  const isAppNav = isAuthenticated && !isLanding;
  const logoTo = isAuthenticated ? '/dashboard' : '/';

  const navLinks = (
    <>
      {navItems.map((item) => {
        const active = isNavActive(location.pathname, item.to);
        return (
          <Link key={item.to} to={item.to} className={navLinkBase(active)}>
            {item.label}
            <NavHighlight show={active} />
          </Link>
        );
      })}
    </>
  );

  const signOutButton = (
    <button
      type="button"
      onClick={() => logout()}
      className="btn-aurora nav-auth-btn hidden whitespace-nowrap md:inline-flex"
    >
      Sign out
    </button>
  );

  const mobileToggle = (
    <button
      type="button"
      className={`flex h-7 w-7 items-center justify-center rounded-lg border md:hidden ${
        isAppNav
          ? 'border-white/[0.08] text-[#c7c8d9]'
          : 'border-slate-200 text-slate-600'
      }`}
      onClick={() => setMenuOpen((o) => !o)}
      aria-label="Toggle menu"
    >
      <span className="text-lg leading-none">{menuOpen ? '✕' : '☰'}</span>
    </button>
  );

  const mobileMenu = menuOpen && (
    <div
      className={`absolute inset-x-0 top-[calc(100%+0.5rem)] max-h-[70vh] overflow-y-auto rounded-3xl border p-4 shadow-[0_16px_48px_rgba(0,0,0,0.15)] backdrop-blur-xl animate-scale-in md:hidden ${
        isAppNav
          ? 'border-white/[0.08] bg-[#0B262B]/98'
          : 'border-white/20 bg-white/98'
      }`}
    >
      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isNavActive(location.pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={`nav-mobile-link ${active ? 'nav-mobile-link--active' : ''}`}
            >
              {item.label}
            </Link>
          );
        })}

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="btn-aurora btn-aurora--wide mt-3"
          >
            Sign out
          </button>
        ) : (
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="btn-aurora btn-aurora--wide mt-3 block text-center"
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );

  const landingNav = (
    <nav
      ref={landingNavRef}
      style={{
        paddingLeft: `${LANDING_NAV_DEFAULTS.paddingX}rem`,
        paddingRight: `${LANDING_NAV_DEFAULTS.paddingX}rem`,
      }}
      className="app-navbar landing-nav grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
    >
      <NavLogo gradientId="navGradLanding" to={logoTo} />

      <div
        ref={landingLinksRef}
        className="navbar-links min-w-0 flex-1 justify-center"
        style={{ gap: `${LANDING_NAV_DEFAULTS.linkGap}rem` }}
      >
        {navLinks}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <div className="hidden shrink-0 items-center justify-end md:flex">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => logout()}
              className="btn-aurora nav-auth-btn whitespace-nowrap"
            >
              Sign out
            </button>
          ) : (
            <Link to="/login" className="btn-aurora nav-auth-btn whitespace-nowrap">
              Sign in
            </Link>
          )}
        </div>
        {mobileToggle}
      </div>
    </nav>
  );

  const appNav = (
    <div className="page-shell relative">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <nav className="app-navbar grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <NavLogo gradientId="navGradApp" to={logoTo} />

          <div className="navbar-links min-w-0 flex-1 justify-center">{navLinks}</div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <div className="hidden shrink-0 md:flex">{signOutButton}</div>
            {mobileToggle}
          </div>
        </nav>

        <div className="dashboard-header-actions">
          <DashboardHeaderActions />
        </div>
      </div>

      {mobileMenu}
    </div>
  );

  useEffect(() => {
    if (!isLanding) return;

    let rafId = 0;

    const update = () => {
      applyLandingNavMetrics(
        window.scrollY,
        landingShellRef.current,
        landingNavRef.current,
        landingLinksRef.current,
      );
      rafId = 0;
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isLanding]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div ref={navRef} className="app-navbar-shell fixed inset-x-0 top-0 z-50">
      {isAppNav ? (
        appNav
      ) : isLanding ? (
        <div className="flex justify-center px-4">
          <div
            ref={landingShellRef}
            className="landing-nav-shell relative w-full"
            style={{ maxWidth: `${LANDING_NAV_DEFAULTS.maxWidth}rem` }}
          >
            {landingNav}
            {mobileMenu}
          </div>
        </div>
      ) : (
        <div className="page-shell page-shell--wide relative">
          {landingNav}
          {mobileMenu}
        </div>
      )}
    </div>
  );
}
