import { cn } from '@/utils/cn.ts';
import { hexToRgba } from '@/utils/color.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { Badge } from './Badge.tsx';
import type { ReactNode } from 'react';

interface TransactionRowProps {
  /** Emoji o ícono del icon field de la categoría */
  icon: string;
  title: string;
  subtitle?: string;
  /** Color semántico (hex) para el ícono tintado y el badge */
  color: string;
  category?: string;
  amount: number;
  type: 'income' | 'expense';
  currency?: string;
  onClick?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}

export function TransactionRow({
  icon,
  title,
  subtitle,
  color,
  category,
  amount,
  type,
  currency = 'ARS',
  onClick,
  rightSlot,
  className,
}: TransactionRowProps) {
  const amountColor =
    type === 'income' ? 'var(--color-green)' : 'var(--color-red)';
  const sign = type === 'income' ? '+' : '-';

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition-colors',
        onClick && 'hover:bg-white/[0.03] active:bg-white/[0.06]',
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-lg"
        style={{
          backgroundColor: hexToRgba(color, 0.14),
          color,
        }}
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-white/40">
          {category && <Badge label={category} color={color} size="sm" />}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: amountColor }}
        >
          {sign}
          {formatCurrency(amount, currency)}
        </span>
        {rightSlot}
      </div>
    </Wrapper>
  );
}
