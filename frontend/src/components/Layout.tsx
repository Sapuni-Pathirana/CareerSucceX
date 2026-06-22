import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a0f]">
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-[0.04]" aria-hidden />
      <div className="landing-hero-grain pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden />
      <Navbar />
      <main className="relative pt-24">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
