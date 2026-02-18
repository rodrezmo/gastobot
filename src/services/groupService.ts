import { supabase } from '@/lib/supabase.ts';
import type {
  Group,
  GroupWithMembers,
  GroupDetail,
  GroupExpense,
  Settlement,
  SettlementWithUsers,
  CreateGroupParams,
  AddGroupExpenseParams,
  CreateSettlementParams,
} from '@/types/shared.ts';

export async function createGroup(params: CreateGroupParams): Promise<Group> {
  // Uses SECURITY DEFINER RPC to avoid self-referential RLS on group_members
  const { data: groupId, error } = await supabase.rpc('create_group_with_member_ids', {
    p_name: params.name,
    p_description: params.description ?? null,
    p_member_ids: params.member_ids,
    p_currency: params.currency ?? 'ARS',
  });
  if (error) throw error;

  const { data: group, error: fetchErr } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId as string)
    .single();

  if (fetchErr) throw fetchErr;
  return group as Group;
}

export async function getGroups(): Promise<GroupWithMembers[]> {
  // Uses SECURITY DEFINER RPC to avoid self-referential RLS on group_members
  const { data, error } = await supabase.rpc('get_user_groups');
  if (error) throw error;
  return (data ?? []) as unknown as GroupWithMembers[];
}

export async function getGroupDetail(groupId: string): Promise<GroupDetail> {
  // Uses SECURITY DEFINER RPC to avoid self-referential RLS on group_members
  const { data, error } = await supabase.rpc('get_group_detail', {
    p_group_id: groupId,
  });
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = data as any;
  const expenses = g.expenses ?? [];
  const total = expenses.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);

  return {
    ...g,
    total,
  } as GroupDetail;
}

export async function addMemberToGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('add_member_to_group_by_id', {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw error;
}

export async function addGroupExpense(params: AddGroupExpenseParams): Promise<GroupExpense> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('group_expenses')
    .insert({
      group_id: params.group_id,
      paid_by: user.id,
      amount: params.amount,
      description: params.description,
      date: params.date,
    })
    .select()
    .single();

  if (error) throw error;
  return data as GroupExpense;
}

export async function deleteGroupExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from('group_expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

export async function createSettlement(params: CreateSettlementParams): Promise<Settlement> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('settlements')
    .insert({
      from_user_id: user.id,
      to_user_id: params.to_user_id,
      amount: params.amount,
      group_id: params.group_id ?? null,
      shared_transaction_id: params.shared_transaction_id ?? null,
      note: params.note ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Settlement;
}

export async function confirmSettlement(settlementId: string): Promise<void> {
  const { error } = await supabase
    .from('settlements')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', settlementId);

  if (error) throw error;
}

export async function settleGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .update({ status: 'settled', settled_at: new Date().toISOString() })
    .eq('id', groupId);

  if (error) throw error;
}

export async function archiveGroup(groupId: string): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', groupId);

  if (error) throw error;
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) throw error;
}

export async function getGroupSettlements(groupId: string): Promise<SettlementWithUsers[]> {
  const { data, error } = await supabase
    .from('settlements')
    .select(
      `
      *,
      from_user:profiles!settlements_from_user_id_fkey (id, email, full_name, avatar_url),
      to_user:profiles!settlements_to_user_id_fkey (id, email, full_name, avatar_url)
    `,
    )
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SettlementWithUsers[];
}
