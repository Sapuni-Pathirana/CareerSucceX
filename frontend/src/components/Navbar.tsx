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

function navItemClass(active: boolean) {
  return `relative inline-flex shrink-0 items-center whitespace-nowrap py-2 text-[13px] font-medium transition-colors duration-200 ${
    active ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
  }`;
}

function navMetrics(scrollY: number) {
  // Short range + linear mapping = highly scroll-sensitive (responds within ~120px)
  const range = 120;
  const progress = Math.min(Math.max(scrollY / range, 0), 1);
  const maxRem = 62;
  const minRem = 52;
  return {
    progress,
    maxWidth: maxRem - (maxRem - minRem) * progress,
    linkGap: 2.5 - 1.0 * progress,
    paddingX: 1.5 - 0.375 * progress,
  };
}

function ActiveIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <>
      <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400" />
      <span className="pointer-events-none absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400" />
    </>
  );
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
        className={`${navItemClass(active || open)} cursor-pointer border-0 bg-transparent`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <ActiveIndicator show={active} />
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
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/20 bg-white/95 py-3
                   shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl will-change-[max-width] md:gap-4"
      >
        <Link to={logoTo} className="flex shrink-0 items-center gap-2 group">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
              <circle cx="16" cy="16" r="13" stroke="url(#navGrad)" strokeWidth="2.5" fill="none" />
              <defs>
                <linearGradient id="navGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f97316" />
                  <stop offset="0.5" stopColor="#a855f7" />
                  <stop offset="1" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-[9px] font-black text-brand-700 leading-none">CS</span>
          </div>
          <span className="hidden text-[15px] font-bold text-slate-900 transition-colors group-hover:text-brand-700 sm:inline">
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
                <Link key={item.to} to={item.to} className={navItemClass(active)}>
                  {item.label}
                  <ActiveIndicator show={active} />
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
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => logout()}
              className="whitespace-nowrap rounded-xl bg-aurora px-5 py-2.5 text-[13px] font-semibold text-white
                         shadow-[0_2px_12px_rgba(99,102,241,0.35)] transition-all duration-200
                         hover:shadow-[0_4px_20px_rgba(99,102,241,0.5)] hover:scale-[1.03] active:scale-[0.97]"
            >
              Sign out
            </button>
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
          className="absolute inset-x-4 top-[72px] max-h-[70vh] overflow-y-auto rounded-2xl border border-white/20 bg-white/98
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
                      ${active ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}
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
                          ${active ? 'font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="mt-3 w-full rounded-xl bg-aurora px-4 py-2.5 text-center text-sm font-semibold text-white shadow-aurora
                           transition-all duration-200 hover:shadow-[0_4px_20px_rgba(99,102,241,0.5)] active:scale-[0.97]"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
