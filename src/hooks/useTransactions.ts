import { useEffect, useCallback, useState } from 'react';
import { useTransactionStore } from '@/stores/transactionStore.ts';
import type { TransactionFilters, CreateTransactionParams, UpdateTransactionParams } from '@/types/api.ts';

export function useTransactions() {
  const store = useTransactionStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    store.fetchTransactions().catch((e: Error) => setError(e.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addTransaction = useCallback(async (params: CreateTransactionParams) => {
    setError(null);
    try {
      await store.addTransaction(params);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to add transaction';
      setError(msg);
      throw e;
    }
  }, [store]);

  const updateTransaction = useCallback(async (id: string, params: UpdateTransactionParams) => {
    setError(null);
    try {
      await store.updateTransaction(id, params);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update transaction';
      setError(msg);
      throw e;
    }
  }, [store]);

  const deleteTransaction = useCallback(async (id: string) => {
    setError(null);
    try {
      await store.deleteTransaction(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete transaction';
      setError(msg);
      throw e;
    }
  }, [store]);

  const setFilters = useCallback((filters: TransactionFilters) => {
    store.setFilters(filters);
  }, [store]);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      await store.fetchTransactions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch transactions';
      setError(msg);
    }
  }, [store]);

  return {
    transactions: store.transactions,
    loading: store.loading,
    error,
    filters: store.filters,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    refetch,
  };
}
