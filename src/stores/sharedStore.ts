import { create } from 'zustand';
import type {
  SharedTransactionWithDetails,
  UserBalance,
  CreateSharedTransactionParams,
} from '@/types/shared.ts';

interface SharedState {
  pendingSharedExpenses: SharedTransactionWithDetails[];
  mySharedExpenses: SharedTransactionWithDetails[];
  balances: UserBalance[];
  loading: boolean;

  fetchPendingSharedExpenses: () => Promise<void>;
  fetchMySharedExpenses: () => Promise<void>;
  fetchBalances: () => Promise<void>;
  createSharedTransaction: (params: CreateSharedTransactionParams) => Promise<void>;
  respondToSharedExpense: (participantId: string, status: 'accepted' | 'rejected') => Promise<void>;
}

export const useSharedStore = create<SharedState>((set, get) => ({
  pendingSharedExpenses: [],
  mySharedExpenses: [],
  balances: [],
  loading: false,

  fetchPendingSharedExpenses: async () => {
    set({ loading: true });
    try {
      const { getPendingSharedExpenses } = await import('@/services/sharedService.ts');
      const expenses = await getPendingSharedExpenses();
      set({ pendingSharedExpenses: expenses, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchMySharedExpenses: async () => {
    set({ loading: true });
    try {
      const { getMySharedExpenses } = await import('@/services/sharedService.ts');
      const expenses = await getMySharedExpenses();
      set({ mySharedExpenses: expenses, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchBalances: async () => {
    try {
      const { getBalances } = await import('@/services/sharedService.ts');
      const balances = await getBalances();
      set({ balances });
    } catch {
      // silently fail
    }
  },

  createSharedTransaction: async (params) => {
    const { createSharedTransaction } = await import('@/services/sharedService.ts');
    await createSharedTransaction(params);
    await get().fetchMySharedExpenses();
    await get().fetchBalances();
  },

  respondToSharedExpense: async (participantId, status) => {
    const { respondToSharedExpense } = await import('@/services/sharedService.ts');
    await respondToSharedExpense(participantId, status);
    await get().fetchPendingSharedExpenses();
    await get().fetchBalances();
  },
}));
