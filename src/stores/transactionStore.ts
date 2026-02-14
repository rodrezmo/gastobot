import { create } from 'zustand';
import type { TransactionState } from '@/types/store.ts';
import * as transactionService from '@/services/transactionService.ts';

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  filters: {},

  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const transactions = await transactionService.getTransactions(get().filters);
      set({ transactions, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addTransaction: async (params) => {
    await transactionService.createTransaction(params);
    await get().fetchTransactions();
  },

  updateTransaction: async (id, params) => {
    await transactionService.updateTransaction(id, params);
    await get().fetchTransactions();
  },

  deleteTransaction: async (id) => {
    await transactionService.deleteTransaction(id);
    await get().fetchTransactions();
  },

  setFilters: (filters) => {
    set({ filters });
  },
}));
