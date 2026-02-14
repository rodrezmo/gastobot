import { create } from 'zustand';
import type { CategoryState } from '@/types/store.ts';
import * as categoryService from '@/services/categoryService.ts';

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const categories = await categoryService.getCategories();
      set({ categories, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addCategory: async (params) => {
    await categoryService.createCategory(params);
    await get().fetchCategories();
  },

  deleteCategory: async (id) => {
    await categoryService.deleteCategory(id);
    await get().fetchCategories();
  },
}));
