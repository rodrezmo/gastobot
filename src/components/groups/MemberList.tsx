import { Crown } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { cn } from '@/utils/cn.ts';
import type { MemberBalance } from '@/types/shared.ts';

interface MemberListProps {
  members: MemberBalance[];
  adminIds?: string[];
}

export function MemberList({ members, adminIds = [] }: MemberListProps) {
  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div
          key={m.userId}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {m.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {m.userName}
                </span>
                {adminIds.includes(m.userId) && (
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                Pago: {formatCurrency(m.paid)} / Parte justa: {formatCurrency(m.fairShare)}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'text-sm font-bold',
              m.netBalance > 0.01
                ? 'text-green-600'
                : m.netBalance < -0.01
                  ? 'text-red-600'
                  : 'text-gray-500',
            )}
          >
            {m.netBalance > 0.01 && '+'}
            {formatCurrency(m.netBalance)}
          </span>
        </div>
      ))}
    </div>
  );
}
