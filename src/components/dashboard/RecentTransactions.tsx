import { ArrowLeftRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDateShort } from '@/utils/formatDate.ts';
import type { TransactionWithCategory } from '@/types/database.ts';

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Últimas transacciones</h3>
        <Link to="/transactions" className="text-sm font-medium text-primary-500 hover:underline">
          Ver todas →
        </Link>
      </div>
      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin transacciones"
          description="Agrega tu primera transacción para empezar"
          actionLabel="Nueva transacción"
          onAction={() => navigate('/transactions/new')}
        />
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 5).map((t) => {
            const categoryInitial = (t.category?.name ?? 'S')[0].toUpperCase();
            const categoryColor = t.category?.color ?? '#6b7280';

            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: categoryColor }}
                >
                  {categoryInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.description ?? t.category?.name ?? 'Sin categoría'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t.category?.name} · {formatDateShort(t.date)}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold tabular-nums flex-shrink-0 ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
