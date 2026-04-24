import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PlusCircle,
  BarChart3,
  Settings,
  Users,
  Target,
  PiggyBank,
} from 'lucide-react';
import { useSharedStore } from '@/stores/sharedStore.ts';
import { NotificationBadge } from '@/components/ui/NotificationBadge.tsx';
import { cn } from '@/utils/cn.ts';

const sidebarLinks = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transacciones', icon: ArrowLeftRight },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/budget', label: 'Presupuestos', icon: Target },
  { to: '/savings', label: 'Ahorros', icon: PiggyBank },
  { to: '/shared', label: 'Compartidos', icon: Users },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

const bottomNavLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transacciones' },
  { to: '/transactions/new', icon: PlusCircle, label: 'Nueva', isAction: true },
  { to: '/shared', icon: Users, label: 'Compartidos' },
  { to: '/settings', icon: Settings, label: 'Ajustes' },
];

export function Sidebar() {
  const pendingCount = useSharedStore((s) => s.pendingSharedExpenses.length);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:flex">
        <nav className="flex-1 space-y-1 p-4">
          {sidebarLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
              {to === '/shared' && pendingCount > 0 && (
                <NotificationBadge count={pendingCount} />
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:hidden">
        {bottomNavLinks.map(({ to, icon: Icon, label, isAction }) => (
          <NavLink
            key={to}
            to={to}
            end={isAction}
            {...(isAction ? { 'aria-label': 'Nueva transacción' } : {})}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5',
                isAction
                  ? 'relative -top-4 rounded-full bg-primary-600 p-3.5 text-white shadow-lg shadow-primary-500/30'
                  : cn(
                      'px-3 py-1 text-xs font-medium',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-500 dark:text-slate-400',
                    ),
              )
            }
          >
            <Icon className={isAction ? 'h-6 w-6' : 'h-5 w-5'} />
            {!isAction && <span>{label}</span>}
            {to === '/shared' && pendingCount > 0 && !isAction && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
