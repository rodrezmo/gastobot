import { formatCurrency } from '@/utils/formatCurrency.ts';
import { cn } from '@/utils/cn.ts';
import type { UserBalance } from '@/types/shared.ts';

interface BalanceCardProps {
  balance: UserBalance;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const isDebt = balance.direction === 'you_owe';

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {balance.userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {balance.userName}
          </p>
          <p className="text-xs text-gray-500">
            {isDebt ? 'Le debes' : 'Te debe'}
          </p>
        </div>
      </div>
      <span
        className={cn(
          'text-sm font-bold',
          isDebt ? 'text-red-600' : 'text-green-600',
        )}
      >
        {formatCurrency(balance.amount)}
      </span>
    </div>
  );
}
