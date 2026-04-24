import { ArrowLeftRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card.tsx';
import { EmptyState } from '@/components/ui/EmptyState.tsx';
import { TransactionRow } from '@/components/ui/TransactionRow.tsx';
import { formatDateShort } from '@/utils/formatDate.ts';
import type { TransactionWithCategory } from '@/types/database.ts';

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
  limit?: number;
}

export function RecentTransactions({
  transactions,
  limit = 5,
}: RecentTransactionsProps) {
  const navigate = useNavigate();

  return (
    <Card
      title="Movimientos recientes"
      action={
        transactions.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-0.5 text-xs font-medium text-white/60 transition-colors hover:text-white"
          >
            Ver todos
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin transacciones"
          description="Agregá tu primera transacción para empezar"
          actionLabel="Nueva transacción"
          onAction={() => navigate('/transactions/new')}
        />
      ) : (
        <ul className="-mx-2 flex flex-col">
          {transactions.slice(0, limit).map((t) => (
            <li key={t.id}>
              <TransactionRow
                icon={t.category?.icon ?? '💸'}
                title={t.description ?? t.category?.name ?? 'Sin categoría'}
                subtitle={formatDateShort(t.date)}
                color={t.category?.color ?? '#5352ED'}
                category={t.category?.name}
                amount={t.amount}
                type={t.type}
                onClick={() => navigate(`/transactions/${t.id}/edit`)}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
