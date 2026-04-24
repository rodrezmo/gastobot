import { create } from 'zustand';
import type { SavingsState } from '@/types/store.ts';
import * as savingsService from '@/services/savingsService.ts';

export const useSavingsStore = create<SavingsState>((set, get) => ({
  totalSaved: 0,
  totalSavedArs: 0,
  totalSavedUsd: 0,
  monthlyAvg: 0,
  goals: [],
  loading: false,
  error: null,

  fetchSummary: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await savingsService.getSavingsSummary();
      set({
        totalSaved: summary.total_ars,
        totalSavedArs: summary.total_ars,
        totalSavedUsd: summary.total_usd,
        monthlyAvg: summary.monthly_avg,
        goals: summary.goals,
        loading: false,
      });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Error al cargar ahorros' });
    }
  },

  upsertGoal: async (params) => {
    await savingsService.upsertSavingsGoal(params);
    await get().fetchSummary();
  },

  deleteGoal: async (id) => {
    await savingsService.deleteSavingsGoal(id);
    await get().fetchSummary();
  },

  recordSavings: async (params) => {
    await savingsService.recordSavingsEntry(params);
    await get().fetchSummary();
  },
}));
