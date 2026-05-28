import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const { pathname } = useLocation();
  // O mapa ocupa a área inteira (sem padding nem max-width).
  const isFullBleed = pathname.startsWith('/mapa');

  return (
    <div className="min-h-screen bg-bg-app">
      <Topbar />
      <Sidebar />
      <main className="ml-60 pt-14">
        {isFullBleed ? (
          <div className="h-[calc(100vh-56px)]">
            <Outlet />
          </div>
        ) : (
          <div className="mx-auto max-w-content px-6 py-6">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
