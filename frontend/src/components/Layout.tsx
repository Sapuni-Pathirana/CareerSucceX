import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  const { pathname } = useLocation();
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#040404]">
      {!isDashboard && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.04]" aria-hidden />
          <div className="landing-hero-grain pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden />
        </>
      )}
      <Navbar />
      <main className={`relative ${isDashboard ? 'pt-16' : 'pt-[4.5rem]'}`}>
        <div className={isDashboard ? 'page-shell py-5' : 'page-shell page-shell--wide py-8'}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
