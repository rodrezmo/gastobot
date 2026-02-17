import { create } from 'zustand';
import type {
  GroupWithMembers,
  GroupDetail,
  SettlementTransfer,
  CreateGroupParams,
  AddGroupExpenseParams,
  CreateSettlementParams,
} from '@/types/shared.ts';

interface GroupState {
  groups: GroupWithMembers[];
  currentGroup: GroupDetail | null;
  settlements: SettlementTransfer[];
  loading: boolean;

  fetchGroups: () => Promise<void>;
  fetchGroupDetail: (groupId: string) => Promise<void>;
  createGroup: (params: CreateGroupParams) => Promise<void>;
  addExpense: (params: AddGroupExpenseParams) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  calculateSettlements: (groupId: string) => SettlementTransfer[];
  createSettlement: (params: CreateSettlementParams) => Promise<void>;
  confirmSettlement: (settlementId: string) => Promise<void>;
  settleGroup: (groupId: string) => Promise<void>;
  archiveGroup: (groupId: string) => Promise<void>;
}

function computeSettlements(group: GroupDetail): SettlementTransfer[] {
  const { expenses, members } = group;
  const totalPaid = new Map<string, number>();
  const nameMap = new Map<string, string>();
  let grandTotal = 0;

  for (const m of members) {
    totalPaid.set(m.user_id, 0);
    nameMap.set(m.user_id, m.user.full_name || m.user.email);
  }

  for (const exp of expenses) {
    totalPaid.set(exp.paid_by, (totalPaid.get(exp.paid_by) || 0) + exp.amount);
    grandTotal += exp.amount;
  }

  const fairShare = grandTotal / members.length;
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, paid] of totalPaid) {
    const net = paid - fairShare;
    if (net > 0.01) {
      creditors.push({ userId, amount: net });
    } else if (net < -0.01) {
      debtors.push({ userId, amount: -net });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
    transfers.push({
      fromUserId: debtors[di].userId,
      toUserId: creditors[ci].userId,
      fromUserName: nameMap.get(debtors[di].userId) || '',
      toUserName: nameMap.get(creditors[ci].userId) || '',
      amount: Math.round(transfer * 100) / 100,
    });

    creditors[ci].amount -= transfer;
    debtors[di].amount -= transfer;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return transfers;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  settlements: [],
  loading: false,

  fetchGroups: async () => {
    set({ loading: true });
    try {
      const { getGroups } = await import('@/services/groupService.ts');
      const groups = await getGroups();
      set({ groups, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchGroupDetail: async (groupId) => {
    set({ loading: true });
    try {
      const { getGroupDetail } = await import('@/services/groupService.ts');
      const group = await getGroupDetail(groupId);
      const settlements = computeSettlements(group);
      set({ currentGroup: group, settlements, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createGroup: async (params) => {
    const { createGroup } = await import('@/services/groupService.ts');
    await createGroup(params);
    await get().fetchGroups();
  },

  addExpense: async (params) => {
    const { addGroupExpense } = await import('@/services/groupService.ts');
    await addGroupExpense(params);
    await get().fetchGroupDetail(params.group_id);
  },

  deleteExpense: async (expenseId) => {
    const { deleteGroupExpense } = await import('@/services/groupService.ts');
    await deleteGroupExpense(expenseId);
    const current = get().currentGroup;
    if (current) await get().fetchGroupDetail(current.id);
  },

  calculateSettlements: (groupId) => {
    const group = get().currentGroup;
    if (!group || group.id !== groupId) return [];
    return computeSettlements(group);
  },

  createSettlement: async (params) => {
    const { createSettlement } = await import('@/services/groupService.ts');
    await createSettlement(params);
    if (params.group_id) await get().fetchGroupDetail(params.group_id);
  },

  confirmSettlement: async (settlementId) => {
    const { confirmSettlement } = await import('@/services/groupService.ts');
    await confirmSettlement(settlementId);
    const current = get().currentGroup;
    if (current) await get().fetchGroupDetail(current.id);
  },

  settleGroup: async (groupId) => {
    const { settleGroup } = await import('@/services/groupService.ts');
    await settleGroup(groupId);
    await get().fetchGroupDetail(groupId);
  },

  archiveGroup: async (groupId) => {
    const { archiveGroup } = await import('@/services/groupService.ts');
    await archiveGroup(groupId);
    await get().fetchGroups();
  },
}));
