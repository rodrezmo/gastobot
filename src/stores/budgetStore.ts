import { create } from 'zustand';
import type { BudgetState } from '@/types/store.ts';
import * as budgetService from '@/services/budgetService.ts';

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  summary: [],
  loading: false,

  fetchBudgets: async () => {
    set({ loading: true });
    try {
      const budgets = await budgetService.getBudgets();
      set({ budgets, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchSummary: async (month: Date) => {
    try {
      const summary = await budgetService.getBudgetSummary(month);
      set({ summary });
    } catch {
      // silently fail — dashboard can render without summary
    }
  },

  upsertBudget: async (params) => {
    await budgetService.upsertBudget(params);
    await get().fetchBudgets();
  },

  deleteBudget: async (id) => {
    await budgetService.deleteBudget(id);
    await get().fetchBudgets();
  },
}));
