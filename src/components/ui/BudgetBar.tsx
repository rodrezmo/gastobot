import { cn } from '@/utils/cn.ts';
import { hexToRgba } from '@/utils/color.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';

interface BudgetBarProps {
  label: string;
  spent: number;
  limit: number;
  currency?: string;
  /** Fuerza un color (hex). Si no se pasa, se calcula según % consumido. */
  color?: string;
  className?: string;
}

export function BudgetBar({
  label,
  spent,
  limit,
  currency = 'ARS',
  color,
  className,
}: BudgetBarProps) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = spent > limit;

  const computedColor =
    color ??
    (pct < 60 ? '#2ED573' : pct < 90 ? '#FFA502' : '#FF4757');

  const rest = Math.max(limit - spent, 0);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium text-white">{label}</span>
        <span className="text-xs text-white/50">
          {over ? (
            <span className="text-[color:var(--color-red)]">
              {formatCurrency(spent - limit, currency)} sobre
            </span>
          ) : (
            <>quedan {formatCurrency(rest, currency)}</>
          )}
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: hexToRgba(computedColor, 0.12) }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: computedColor,
          }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-white/40">
        <span>{formatCurrency(spent, currency)}</span>
        <span>{formatCurrency(limit, currency)}</span>
      </div>
    </div>
  );
}
