import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardHeaderActions from './DashboardHeaderActions';
import { useAuth } from '../context/AuthContext';

type NavLink = { to: string; label: string };

type NavItem =
  | { type: 'link'; to: string; label: string }
  | { type: 'group'; id: string; label: string; items: NavLink[] };

const navItems: NavItem[] = [
  { type: 'link', to: '/dashboard', label: 'Dashboard' },
  {
    type: 'group',
    id: 'analyze',
    label: 'Analyze',
    items: [
      { to: '/cv', label: 'CV Analysis' },
      { to: '/github', label: 'GitHub' },
    ],
  },
  { type: 'link', to: '/interviews', label: 'Interviews' },
  {
    type: 'group',
    id: 'skills',
    label: 'Skills',
    items: [
      { to: '/skills', label: 'My Skills' },
      { to: '/verification', label: 'Verification' },
    ],
  },
  { type: 'link', to: '/roadmap', label: 'Learning Roadmap' },
];

function isNavActive(pathname: string, to: string) {
  if (to === '/dashboard') return pathname === '/dashboard';
  return pathname === to || pathname.startsWith(`${to}/`);
}

function isGroupActive(pathname: string, items: NavLink[]) {
  return items.some((item) => isNavActive(pathname, item.to));
}

function navLinkBase(active: boolean, open = false) {
  const highlighted = active || open;
  return `nav-link group ${highlighted ? 'nav-link--active' : ''}`;
}

function NavHighlight({ show }: { show: boolean }) {
  return (
    <span
      className={`nav-link__underline ${show ? 'nav-link__underline--show' : ''}`}
    />
  );
}
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function navMetrics(scrollY: number) {
  const range = 360;
  const linear = Math.min(Math.max(scrollY / range, 0), 1);
  const progress = easeOutCubic(linear);
  const maxRem = 70;
  const minRem = 54;
  return {
    progress,
    maxWidth: maxRem - (maxRem - minRem) * progress,
    linkGap: 2.5 - 1.0 * progress,
    paddingX: 1.5 - 0.375 * progress,
  };
}

function NavDropdown({
  label,
  items,
  pathname,
  open,
  onOpen,
  onClose,
}: {
  label: string;
  items: NavLink[];
  pathname: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const active = isGroupActive(pathname, items);

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        className={`${navLinkBase(active, open)} cursor-pointer border-0 bg-transparent`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <NavHighlight show={active || open} />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
          <div className="min-w-[11rem] overflow-hidden rounded-xl border border-slate-200/80 bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.1)]">
            {items.map((item) => {
              const itemActive = isNavActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`nav-dropdown-item ${itemActive ? 'nav-dropdown-item--active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isLanding = location.pathname === '/';
  const logoTo = isAuthenticated ? '/dashboard' : '/';
  const metrics = isDashboard
    ? { progress: 0, maxWidth: 82.5, linkGap: 2, paddingX: 1.5 }
    : navMetrics(scrollY);
  const shellClass = isDashboard ? 'page-shell' : 'page-shell page-shell--wide';

  const standardNav = (
    <nav
      style={{
        maxWidth: `${metrics.maxWidth}rem`,
        paddingLeft: `${metrics.paddingX}rem`,
        paddingRight: `${metrics.paddingX}rem`,
      }}
      className={`app-navbar grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 will-change-[max-width] ${isLanding ? 'landing-nav' : 'transition-[max-width,padding] duration-200 ease-out'}`}
    >
      <Link to={logoTo} className="nav-logo group flex shrink-0 items-center gap-2">
        <div className="nav-logo-mark">
          <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
            <circle cx="16" cy="16" r="13" stroke="url(#navGrad)" strokeWidth="2.5" fill="none" />
            <defs>
              <linearGradient id="navGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#114852" />
                <stop offset="0.5" stopColor="#008080" />
                <stop offset="1" stopColor="#00B1B1" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute text-[11px] font-black text-[#008080] leading-none">CS</span>
        </div>
        <span className="nav-logo__text">
          CareerSucceX
        </span>
      </Link>

      <div
        className="navbar-links min-w-0 flex-1 justify-center"
        style={isLanding ? { gap: `${metrics.linkGap}rem` } : undefined}
      >
        {navItems.map((item) => {
          if (item.type === 'link') {
            const active = isNavActive(location.pathname, item.to);
            return (
              <Link key={item.to} to={item.to} className={navLinkBase(active)}>
                {item.label}
                <NavHighlight show={active} />
              </Link>
            );
          }

          return (
            <NavDropdown
              key={item.id}
              label={item.label}
              items={item.items}
              pathname={location.pathname}
              open={openDropdown === item.id}
              onOpen={() => setOpenDropdown(item.id)}
              onClose={() => setOpenDropdown(null)}
            />
          );
        })}
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
            <Link
              to="/login"
              className="btn-aurora nav-auth-btn whitespace-nowrap"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="text-lg leading-none">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>
    </nav>
  );

  const mobileMenu = menuOpen && (
    <div
      className="absolute inset-x-0 top-[calc(100%+0.5rem)] max-h-[70vh] overflow-y-auto rounded-3xl border border-white/20 bg-white/98
                 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.15)] backdrop-blur-xl animate-scale-in md:hidden"
    >
      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          if (item.type === 'link') {
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
          }

          return (
            <div key={item.id} className="pt-1">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {item.label}
              </p>
              {item.items.map((sub) => {
                const active = isNavActive(location.pathname, sub.to);
                return (
                  <Link
                    key={sub.to}
                    to={sub.to}
                    onClick={() => setMenuOpen(false)}
                    className={`nav-mobile-sublink ${active ? 'nav-mobile-sublink--active' : ''}`}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
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

  useEffect(() => {
    let rafId = 0;
    let smoothY = window.scrollY;

    const tick = () => {
      const target = window.scrollY;
      smoothY += (target - smoothY) * 0.1;
      setScrollY(smoothY);
      if (Math.abs(target - smoothY) > 0.2) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={navRef} className="app-navbar-shell fixed inset-x-0 top-0 z-50">
      {isDashboard && isAuthenticated ? (
        <div className={`${shellClass} relative`}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <nav
              className="app-navbar dashboard-nav flex min-w-0 flex-1 items-center gap-6"
            >
              <Link to={logoTo} className="nav-logo group flex shrink-0 items-center gap-2">
                <div className="nav-logo-mark">
                  <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
                    <circle cx="16" cy="16" r="13" stroke="url(#navGradDash)" strokeWidth="2.5" fill="none" />
                    <defs>
                      <linearGradient id="navGradDash" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#114852" />
                        <stop offset="0.5" stopColor="#008080" />
                        <stop offset="1" stopColor="#00B1B1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-[11px] font-black text-[#008080] leading-none">CS</span>
                </div>
                <span className="nav-logo__text">
                  CareerSucceX
                </span>
              </Link>

              <div className="navbar-links min-w-0 flex-1 justify-center">
                {navItems.map((item) => {
                  if (item.type === 'link') {
                    const active = isNavActive(location.pathname, item.to);
                    return (
                      <Link key={item.to} to={item.to} className={navLinkBase(active)}>
                        {item.label}
                        <NavHighlight show={active} />
                      </Link>
                    );
                  }

                  return (
                    <NavDropdown
                      key={item.id}
                      label={item.label}
                      items={item.items}
                      pathname={location.pathname}
                      open={openDropdown === item.id}
                      onOpen={() => setOpenDropdown(item.id)}
                      onClose={() => setOpenDropdown(null)}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                <span className="text-lg leading-none">{menuOpen ? '✕' : '☰'}</span>
              </button>
            </nav>

            <div className="dashboard-header-actions">
              <DashboardHeaderActions />
            </div>
          </div>

          {mobileMenu}
        </div>
      ) : isLanding ? (
        <div className="flex justify-center px-4">
          <div
            className="landing-nav-shell relative w-full"
            style={{ maxWidth: `${metrics.maxWidth}rem` }}
          >
            {standardNav}
            {mobileMenu}
          </div>
        </div>
      ) : (
        <div className={`${shellClass} relative`}>
          {standardNav}
          {mobileMenu}
        </div>
      )}
    </div>
  );
}
