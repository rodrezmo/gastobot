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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({
      name: params.name,
      description: params.description ?? null,
      creator_id: user.id,
    })
    .select()
    .single();

  if (groupErr) throw groupErr;

  // Add creator as admin
  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'admin',
  });

  // Search and add members by email
  for (const email of params.member_emails) {
    const { data: users } = await supabase.rpc('search_users_by_email', {
      search_email: email,
    });
    if (users && users.length > 0) {
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: users[0].id,
        role: 'member',
      });
    }
  }

  return group as Group;
}

export async function getGroups(): Promise<GroupWithMembers[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('groups')
    .select(
      `
      *,
      group_members (
        *,
        user:profiles!group_members_user_id_fkey (id, email, full_name, avatar_url)
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (
    (data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((g: any) => ({
        ...g,
        members: g.group_members,
      })) as GroupWithMembers[]
  );
}

export async function getGroupDetail(groupId: string): Promise<GroupDetail> {
  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .select(
      `
      *,
      group_members (
        *,
        user:profiles!group_members_user_id_fkey (id, email, full_name, avatar_url)
      ),
      group_expenses (
        *,
        payer:profiles!group_expenses_paid_by_fkey (id, email, full_name, avatar_url)
      ),
      settlements (
        *,
        from_user:profiles!settlements_from_user_id_fkey (id, email, full_name, avatar_url),
        to_user:profiles!settlements_to_user_id_fkey (id, email, full_name, avatar_url)
      )
    `,
    )
    .eq('id', groupId)
    .single();

  if (groupErr) throw groupErr;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = group as any;
  const expenses = g.group_expenses ?? [];
  const total = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);

  return {
    ...g,
    members: g.group_members,
    expenses,
    total,
    settlements: g.settlements ?? [],
  } as GroupDetail;
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
