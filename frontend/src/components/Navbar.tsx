import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-blue-600 text-sm font-bold text-white">
            CS
          </div>
          <span className="text-lg font-bold text-slate-900">CareerSucceX</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
