import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#040404]">
      <Navbar />
      <main className="relative pt-16">
        <div className="page-shell py-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
