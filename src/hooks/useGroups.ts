import { useEffect } from 'react';
import { useGroupStore } from '@/stores/groupStore.ts';

export function useGroups() {
  const store = useGroupStore();

  useEffect(() => {
    void store.fetchGroups();
  }, []);

  return {
    groups: store.groups,
    loading: store.loading,
    createGroup: store.createGroup,
  };
}
