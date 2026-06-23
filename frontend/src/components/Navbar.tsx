import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
      { to: '/roadmap', label: 'Learning Roadmap' },
      { to: '/verification', label: 'Verification' },
    ],
  },
  { type: 'link', to: '/profile', label: 'Profile' },
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
  return `group relative inline-flex shrink-0 items-center whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
    highlighted
      ? 'bg-brand-50 text-brand-700 font-semibold'
      : 'text-slate-600 hover:bg-brand-50/80 hover:text-brand-700'
  }`;
}

function NavHighlight({ show }: { show: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute inset-x-2 bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 transition-opacity duration-200 ${
        show ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}
    />
  );
}
function navMetrics(scrollY: number) {
  // Short range + linear mapping = highly scroll-sensitive (responds within ~120px)
  const range = 120;
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
                  className={`block px-4 py-2.5 text-[13px] font-medium transition-colors
                    ${itemActive
                      ? 'border-l-2 border-brand-500 bg-brand-50 pl-[14px] text-brand-700'
                      : 'border-l-2 border-transparent text-slate-600 hover:border-brand-300 hover:bg-brand-50/70 hover:pl-[14px] hover:text-brand-700'
                    }`}
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

  const logoTo = isAuthenticated ? '/dashboard' : '/';
  const metrics = navMetrics(scrollY);

  useEffect(() => {
    let rafId = 0;

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
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
    <div ref={navRef} className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5">
      <nav
        style={{
          maxWidth: `${metrics.maxWidth}rem`,
          paddingLeft: `${metrics.paddingX}rem`,
          paddingRight: `${metrics.paddingX}rem`,
        }}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-white/20 bg-white/95 py-3
                   shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl will-change-[max-width] md:gap-4"
      >
        <Link to={logoTo} className="flex shrink-0 items-center gap-2.5 group">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
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
            <span className="absolute text-[11px] font-black text-brand-700 leading-none">CS</span>
          </div>
          <span className="hidden text-[17px] font-bold tracking-tight text-slate-900 transition-colors group-hover:text-brand-700 sm:inline">
            CareerSucceX
          </span>
        </Link>

        {/* Desktop nav — equal spacing, gap scales with scroll */}
        <div
          className="hidden min-w-0 items-center justify-center md:flex"
          style={{ gap: `${metrics.linkGap}rem` }}
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

        <div className="hidden shrink-0 items-center justify-end md:flex">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => logout()}
              className="btn-aurora whitespace-nowrap"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="btn-aurora whitespace-nowrap"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className="text-lg leading-none">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </nav>

      {/* Mobile — flat grouped list, no chevrons */}
      {menuOpen && (
        <div
          className="absolute inset-x-4 top-[72px] max-h-[70vh] overflow-y-auto rounded-3xl border border-white/20 bg-white/98
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
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors
                      ${active
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-700 hover:bg-brand-50/80 hover:text-brand-700'
                      }`}
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
                        className={`block rounded-xl px-4 py-2 text-sm transition-colors
                          ${active
                            ? 'bg-brand-50 font-semibold text-brand-700'
                            : 'text-slate-600 hover:bg-brand-50/80 hover:text-brand-700'
                          }`}
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
      )}
    </div>
  );
}
