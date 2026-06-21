import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/cv', label: 'CV Analysis', icon: '📄' },
  { to: '/github', label: 'GitHub', icon: '🐙' },
  { to: '/interviews', label: 'Mock Interviews', icon: '🎤' },
  { to: '/skills', label: 'Skills', icon: '🎯' },
  { to: '/roadmap', label: 'Learning Roadmap', icon: '🗺️' },
  { to: '/verification', label: 'Verification', icon: '✅' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-blue-600 text-sm font-bold text-white">
            CS
          </div>
          <div>
            <p className="font-bold text-slate-900">CareerSucceX</p>
            <p className="text-xs text-slate-500">Career readiness</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 truncate text-sm">
          <p className="font-medium text-slate-900">{user?.profile?.fullName || 'Student'}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
