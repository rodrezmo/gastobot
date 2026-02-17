import { useEffect } from 'react';
import { useGroupStore } from '@/stores/groupStore.ts';

export function useGroupDetail(groupId: string) {
  const store = useGroupStore();

  useEffect(() => {
    void store.fetchGroupDetail(groupId);
  }, [groupId]);

  return {
    group: store.currentGroup,
    loading: store.loading,
    addExpense: store.addExpense,
    deleteExpense: store.deleteExpense,
    settlements: store.settlements,
    calculateSettlements: () => store.calculateSettlements(groupId),
    createSettlement: store.createSettlement,
    confirmSettlement: store.confirmSettlement,
    settleGroup: () => store.settleGroup(groupId),
    archiveGroup: () => store.archiveGroup(groupId),
  };
}
