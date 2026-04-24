import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Users,
  Plus,
  LogOut,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore.ts';
import { useSharedStore } from '@/stores/sharedStore.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { NotificationBadge } from '@/components/ui/NotificationBadge.tsx';
import { cn } from '@/utils/cn.ts';

const links = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/transactions', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/shared', label: 'Compartidos', icon: Users },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const pendingCount = useSharedStore((s) => s.pendingSharedExpenses.length);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const initials = getInitials(user?.full_name, user?.email);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Logo */}
        <div className="flex h-20 items-center px-6">
          <span className="font-display text-grad-primary text-2xl leading-none">
            GastoBot
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-[14px] bg-grad-primary opacity-100"
                      aria-hidden
                    />
                  )}
                  <Icon className="relative h-5 w-5 shrink-0" />
                  <span className="relative">{label}</span>
                  {to === '/shared' && pendingCount > 0 && (
                    <span className="relative ml-auto">
                      <NotificationBadge count={pendingCount} />
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* CTA primaria */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              navigate('/transactions/new');
            }}
            className="bg-grad-primary shadow-cta flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Nueva transacción
          </button>
        </div>

        {/* Chip de usuario */}
        <div className="m-3 flex items-center gap-2 rounded-[14px] border border-white/5 bg-white/[0.03] p-3">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              navigate('/settings');
            }}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <div className="bg-grad-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.full_name ?? 'Usuario'}
              </p>
              <p className="truncate text-xs text-white/40">
                {user?.nickname ? `@${user.nickname}` : user?.email}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}

function getInitials(fullName: string | null | undefined, email: string | null | undefined) {
  const source = fullName?.trim() || email?.split('@')[0] || '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
