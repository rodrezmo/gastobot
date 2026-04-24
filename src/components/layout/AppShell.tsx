import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { BottomNav } from './BottomNav.tsx';
import { useUIStore } from '@/stores/uiStore.ts';
import { useAuthStore } from '@/stores/authStore.ts';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const initials = getInitials(user?.full_name, user?.email);

  return (
    <div
      className="min-h-screen lg:flex"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar mobile */}
        <header
          className="sticky top-0 z-20 flex h-14 items-center justify-between border-b px-4 lg:hidden"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-grad-primary text-lg leading-none">
            GastoBot
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label="Perfil"
            className="bg-grad-primary flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
          >
            {initials}
          </button>
        </header>

        <main
          key={location.pathname}
          className="animate-page-in flex-1 px-4 pb-24 pt-4 lg:px-8 lg:pb-8 lg:pt-8"
        >
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

function getInitials(
  fullName: string | null | undefined,
  email: string | null | undefined,
) {
  const source = fullName?.trim() || email?.split('@')[0] || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
