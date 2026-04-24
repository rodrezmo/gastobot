import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Settings,
  Plus,
} from 'lucide-react';
import { useSharedStore } from '@/stores/sharedStore.ts';
import { NotificationBadge } from '@/components/ui/NotificationBadge.tsx';
import { cn } from '@/utils/cn.ts';
import type { LucideIcon } from 'lucide-react';

type Item = { to: string; label: string; icon: LucideIcon };

const leftItems: Item[] = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/transactions', label: 'Movs.', icon: ArrowLeftRight },
];

const rightItems: Item[] = [
  { to: '/shared', label: 'Compart.', icon: Users },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

export function BottomNav() {
  const navigate = useNavigate();
  const pendingCount = useSharedStore((s) => s.pendingSharedExpenses.length);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t lg:hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="relative mx-auto grid max-w-md grid-cols-5 items-end">
        {leftItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* FAB central elevado */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/transactions/new')}
            aria-label="Nueva transacción"
            className="bg-grad-primary shadow-cta -mt-6 flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        {rightItems.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === '/shared' ? pendingCount : 0}
          />
        ))}
      </div>
    </nav>
  );
}

type NavItemProps = Item & { badge?: number };

function NavItem({ to, label, icon: Icon, badge = 0 }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
          isActive ? 'text-white' : 'text-white/40 hover:text-white/70',
        )
      }
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {badge > 0 && (
          <span className="absolute -right-2 -top-1">
            <NotificationBadge count={badge} />
          </span>
        )}
      </span>
      {label}
    </NavLink>
  );
}
