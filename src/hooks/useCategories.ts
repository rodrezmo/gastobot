import { useEffect, useCallback, useState } from 'react';
import { useCategoryStore } from '@/stores/categoryStore.ts';
import type { CreateCategoryParams } from '@/types/api.ts';
import type { CategoryType } from '@/types/database.ts';

export function useCategories(filterType?: CategoryType) {
  const store = useCategoryStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (store.categories.length === 0) {
      store.fetchCategories().catch((e: Error) => setError(e.message));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addCategory = useCallback(async (params: CreateCategoryParams) => {
    setError(null);
    try {
      await store.addCategory(params);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to add category';
      setError(msg);
      throw e;
    }
  }, [store]);

  const deleteCategory = useCallback(async (id: string) => {
    setError(null);
    try {
      await store.deleteCategory(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete category';
      setError(msg);
      throw e;
    }
  }, [store]);

  const categories = filterType
    ? store.categories.filter((c) => c.type === filterType)
    : store.categories;

  return {
    categories,
    allCategories: store.categories,
    loading: store.loading,
    error,
    addCategory,
    deleteCategory,
    refetch: store.fetchCategories,
  };
}
