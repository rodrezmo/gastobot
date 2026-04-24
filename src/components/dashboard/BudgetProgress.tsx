import { cn } from '@/utils/cn.ts';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import type { BudgetSummaryItem } from '@/types/api.ts';

interface BudgetProgressProps {
  items: BudgetSummaryItem[];
}

function getBudgetColor(percentage: number) {
  if (percentage >= 90) return { bar: 'bg-red-500', text: 'text-red-500' };
  if (percentage >= 70) return { bar: 'bg-yellow-500', text: 'text-yellow-500' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-500' };
}

export function BudgetProgress({ items }: BudgetProgressProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Presupuestos del mes
      </h2>
      <ul className="space-y-4">
        {items.map((item) => {
          const pct = Math.min(item.percentage, 100);
          const colors = getBudgetColor(item.percentage);

          return (
            <li key={item.budget_id}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.category_color }}
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.category_name}
                  </span>
                </div>
                <div className="text-right">
                  <span className={cn('text-xs font-semibold', colors.text)}>
                    {item.percentage.toFixed(0)}%
                  </span>
                  <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                    {formatCurrency(item.spent_amount)} / {formatCurrency(item.limit_amount)}
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', colors.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
