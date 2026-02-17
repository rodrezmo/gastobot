import { useEffect } from 'react';
import { useSharedStore } from '@/stores/sharedStore.ts';

export function useSharedExpenses() {
  const store = useSharedStore();

  useEffect(() => {
    void store.fetchPendingSharedExpenses();
    void store.fetchMySharedExpenses();
    void store.fetchBalances();
  }, []);

  return {
    pending: store.pendingSharedExpenses,
    sent: store.mySharedExpenses,
    balances: store.balances,
    loading: store.loading,
    share: store.createSharedTransaction,
    respond: store.respondToSharedExpense,
  };
}
