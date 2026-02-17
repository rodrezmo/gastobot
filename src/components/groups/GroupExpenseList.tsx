import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDate } from '@/utils/formatDate.ts';
import type { GroupExpenseWithPayer } from '@/types/shared.ts';

interface GroupExpenseListProps {
  expenses: GroupExpenseWithPayer[];
  currentUserId: string;
  onDelete?: (expenseId: string) => void;
}

export function GroupExpenseList({ expenses, currentUserId, onDelete }: GroupExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        No hay gastos registrados todavia.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {expense.description}
            </p>
            <p className="text-xs text-gray-500">
              {expense.payer.full_name || expense.payer.email} - {formatDate(expense.date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(expense.amount)}
            </span>
            {expense.paid_by === currentUserId && onDelete && (
              <button
                onClick={() => onDelete(expense.id)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
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
