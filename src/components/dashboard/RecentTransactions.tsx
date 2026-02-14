import { ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card.tsx';
import { EmptyState } from '@/components/ui/EmptyState.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { formatCurrency } from '@/utils/formatCurrency.ts';
import { formatDateShort } from '@/utils/formatDate.ts';
import type { TransactionWithCategory } from '@/types/database.ts';

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const navigate = useNavigate();

  return (
    <Card title="Transacciones recientes">
      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin transacciones"
          description="Agrega tu primera transaccion para empezar"
          actionLabel="Nueva transaccion"
          onAction={() => navigate('/transactions/new')}
        />
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Badge label={t.category.name} color={t.category.color} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t.description ?? t.category.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatDateShort(t.date)}</p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  t.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {t.type === 'income' ? '+' : '-'}
                {formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
