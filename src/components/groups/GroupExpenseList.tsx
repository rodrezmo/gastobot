import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import type { GroupExpenseWithPayer } from '@/types/shared.ts';

interface GroupExpenseListProps {
  expenses: GroupExpenseWithPayer[];
  currentUserId: string;
  currency?: string;
  onDelete?: (expenseId: string) => void;
}

export function GroupExpenseList({
  expenses,
  currentUserId,
  currency = 'ARS',
  onDelete,
}: GroupExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/40">
        No hay gastos registrados todavía.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {expense.description}
            </p>
            <p className="mt-0.5 truncate text-[11px] uppercase tracking-wider text-white/40">
              {expense.payer.full_name || expense.payer.email} ·{' '}
              {formatDate(expense.date)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-white">
              {formatCurrency(Number(expense.amount), currency)}
            </span>
            {expense.paid_by === currentUserId && onDelete && (
              <button
                onClick={() => onDelete(expense.id)}
                className="flex h-8 w-8 items-center justify-center rounded-[10px] text-white/40 transition-colors hover:bg-white/5 hover:text-[color:var(--color-red)]"
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
