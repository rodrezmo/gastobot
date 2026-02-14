import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { TransactionList } from '@/components/transactions/TransactionList.tsx';
import { FilterBar } from '@/components/transactions/FilterBar.tsx';
import { useTransactionStore } from '@/stores/transactionStore.ts';
import { useCategoryStore } from '@/stores/categoryStore.ts';

export function TransactionListPage() {
  const navigate = useNavigate();
  const { transactions, loading, filters, fetchTransactions, deleteTransaction, setFilters } =
    useTransactionStore();
  const { fetchCategories } = useCategoryStore();

  useEffect(() => {
    void fetchCategories();
    void fetchTransactions();
  }, [fetchCategories, fetchTransactions]);

  useEffect(() => {
    void fetchTransactions();
  }, [filters, fetchTransactions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transacciones</h1>
        <Button onClick={() => navigate('/transactions/new')}>
          <PlusCircle className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <TransactionList
        transactions={transactions}
        loading={loading}
        onDelete={(id) => void deleteTransaction(id)}
      />
    </div>
  );
}
