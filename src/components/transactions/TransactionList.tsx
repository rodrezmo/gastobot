import { ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState.tsx';
import { Spinner } from '@/components/ui/Spinner.tsx';
import { TransactionItem } from './TransactionItem.tsx';
import type { TransactionWithCategory } from '@/types/database.ts';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, loading, onDelete }: TransactionListProps) {
  const navigate = useNavigate();

  if (loading) return <Spinner className="py-12" />;

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Sin transacciones"
        description="No se encontraron transacciones con los filtros actuales"
        actionLabel="Nueva transaccion"
        onAction={() => navigate('/transactions/new')}
      />
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <TransactionItem key={t.id} transaction={t} onDelete={onDelete} />
      ))}
    </div>
  );
}
