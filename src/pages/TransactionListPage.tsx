import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { TransactionList } from '@/components/transactions/TransactionList.tsx';
import { FilterBar } from '@/components/transactions/FilterBar.tsx';
import { useTransactionStore } from '@/stores/transactionStore.ts';
import { useCategoryStore } from '@/stores/categoryStore.ts';

export function TransactionListPage() {
  const navigate = useNavigate();
  const {
    transactions,
    loading,
    filters,
    fetchTransactions,
    deleteTransaction,
    setFilters,
  } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();

  useEffect(() => {
    void fetchCategories();
    void fetchTransactions();
  }, [fetchCategories, fetchTransactions]);

  useEffect(() => {
    void fetchTransactions();
  }, [filters, fetchTransactions]);

  const counts = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'income') income++;
      else expense++;
    }
    return { all: transactions.length, income, expense };
  }, [transactions]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Movimientos</h1>
          <p className="mt-1 text-sm text-white/50">
            {transactions.length} registros
          </p>
        </div>
        <Button
          onClick={() => navigate('/transactions/new')}
          size="md"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Nueva</span>
        </Button>
      </div>

      <FilterBar filters={filters} onChange={setFilters} counts={counts} />

      <TransactionList
        transactions={transactions}
        loading={loading}
        onDelete={(id) => void deleteTransaction(id)}
      />
    </div>
  );
}
