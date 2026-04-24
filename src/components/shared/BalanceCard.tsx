import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { UserBalance } from '@/types/shared.ts';

interface BalanceCardProps {
  balance: UserBalance;
  currency?: string;
}

export function BalanceCard({ balance, currency = 'ARS' }: BalanceCardProps) {
  const isDebt = balance.direction === 'you_owe';
  const color = isDebt ? 'var(--color-red)' : 'var(--color-green)';

  return (
    <div
      className="flex items-center justify-between rounded-[14px] border px-3 py-2.5"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{
            background: 'var(--grad-primary)',
            boxShadow: 'var(--shadow-cta)',
          }}
        >
          {balance.userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{balance.userName}</p>
          <p className="text-[11px] uppercase tracking-wider text-white/40">
            {isDebt ? 'Le debés' : 'Te debe'}
          </p>
        </div>
      </div>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {formatCurrency(balance.amount, currency)}
      </span>
    </div>
  );
}
