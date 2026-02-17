import { supabase } from '@/lib/supabase.ts';
import type {
  SharedTransactionWithDetails,
  UserBalance,
  CreateSharedTransactionParams,
  UserSearchResult,
} from '@/types/shared.ts';

export async function searchUsersByEmail(email: string): Promise<UserSearchResult[]> {
  const { data, error } = await supabase.rpc('search_users_by_email', {
    search_email: email,
  });
  if (error) throw error;
  return (data as UserSearchResult[]) ?? [];
}

export async function createSharedTransaction(
  params: CreateSharedTransactionParams,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: shared, error: sharedErr } = await supabase
    .from('shared_transactions')
    .insert({
      transaction_id: params.transaction_id,
      owner_id: user.id,
      split_method: params.split_method,
      total_amount: params.participants.reduce((sum, p) => sum + p.amount, 0),
      note: params.note ?? null,
    })
    .select()
    .single();

  if (sharedErr) throw sharedErr;

  const participants = params.participants.map((p) => ({
    shared_transaction_id: shared.id,
    user_id: p.user_id,
    amount: p.amount,
    percentage: p.percentage ?? null,
    status: (p.user_id === user.id ? 'accepted' : 'pending') as 'accepted' | 'pending',
  }));

  const { error: partErr } = await supabase
    .from('shared_transaction_participants')
    .insert(participants);

  if (partErr) throw partErr;
}

export async function getPendingSharedExpenses(): Promise<SharedTransactionWithDetails[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('shared_transaction_participants')
    .select(
      `
      shared_transaction_id,
      shared_transactions (
        *,
        transactions (*),
        owner:profiles!shared_transactions_owner_id_fkey (id, email, full_name, avatar_url),
        shared_transaction_participants (
          *,
          user:profiles!shared_transaction_participants_user_id_fkey (id, email, full_name, avatar_url)
        )
      )
    `,
    )
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) throw error;

  return (
    (data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => {
        const st = row.shared_transactions;
        return {
          ...st,
          transaction: st.transactions,
          owner: st.owner,
          participants: st.shared_transaction_participants,
        };
      }) as SharedTransactionWithDetails[]
  );
}

export async function getMySharedExpenses(): Promise<SharedTransactionWithDetails[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('shared_transactions')
    .select(
      `
      *,
      transactions (*),
      owner:profiles!shared_transactions_owner_id_fkey (id, email, full_name, avatar_url),
      shared_transaction_participants (
        *,
        user:profiles!shared_transaction_participants_user_id_fkey (id, email, full_name, avatar_url)
      )
    `,
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (
    (data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((st: any) => ({
        ...st,
        transaction: st.transactions,
        owner: st.owner,
        participants: st.shared_transaction_participants,
      })) as SharedTransactionWithDetails[]
  );
}

export async function respondToSharedExpense(
  participantId: string,
  status: 'accepted' | 'rejected',
): Promise<void> {
  const { error } = await supabase
    .from('shared_transaction_participants')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', participantId);

  if (error) throw error;
}

export async function getBalances(): Promise<UserBalance[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const myId = user.id;

  // Get all shared transactions I own (others owe me)
  const { data: myShared, error: e1 } = await supabase
    .from('shared_transactions')
    .select(
      `
      id,
      shared_transaction_participants (
        user_id, amount, status,
        user:profiles!shared_transaction_participants_user_id_fkey (id, email, full_name, avatar_url)
      )
    `,
    )
    .eq('owner_id', myId);
  if (e1) throw e1;

  // Get participations where I accepted (I owe the owner)
  const { data: othersShared, error: e2 } = await supabase
    .from('shared_transaction_participants')
    .select(
      `
      amount, status,
      shared_transactions (
        owner_id,
        owner:profiles!shared_transactions_owner_id_fkey (id, email, full_name, avatar_url)
      )
    `,
    )
    .eq('user_id', myId)
    .eq('status', 'accepted');
  if (e2) throw e2;

  // Get confirmed settlements
  const { data: settlements, error: e3 } = await supabase
    .from('settlements')
    .select(
      `
      from_user_id, to_user_id, amount, status,
      from_user:profiles!settlements_from_user_id_fkey (id, email, full_name, avatar_url),
      to_user:profiles!settlements_to_user_id_fkey (id, email, full_name, avatar_url)
    `,
    )
    .or(`from_user_id.eq.${myId},to_user_id.eq.${myId}`)
    .eq('status', 'confirmed');
  if (e3) throw e3;

  // Aggregate net balances per counterparty
  const balanceMap = new Map<string, { amount: number; userName: string }>();

  const addBalance = (userId: string, userName: string, delta: number) => {
    const existing = balanceMap.get(userId);
    if (existing) {
      existing.amount += delta;
    } else {
      balanceMap.set(userId, { amount: delta, userName });
    }
  };

  // Others owe me (accepted participants of my shared transactions)
  for (const shared of myShared ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (shared as any).shared_transaction_participants ?? []) {
      if (p.user_id !== myId && p.status === 'accepted') {
        const u = p.user;
        addBalance(p.user_id, u.full_name || u.email, p.amount);
      }
    }
  }

  // I owe others (shared expenses I accepted as participant)
  for (const p of othersShared ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const st = (p as any).shared_transactions;
    if (st && st.owner_id !== myId) {
      addBalance(st.owner_id, st.owner.full_name || st.owner.email, -p.amount);
    }
  }

  // Settlements reduce balances
  for (const s of settlements ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = s as any;
    if (row.from_user_id === myId) {
      addBalance(row.to_user_id, row.to_user.full_name || row.to_user.email, row.amount);
    } else {
      addBalance(row.from_user_id, row.from_user.full_name || row.from_user.email, -row.amount);
    }
  }

  const result: UserBalance[] = [];
  for (const [userId, { amount, userName }] of balanceMap) {
    if (Math.abs(amount) < 0.01) continue;
    result.push({
      userId,
      userName,
      amount: Math.abs(Math.round(amount * 100) / 100),
      direction: amount > 0 ? 'owes_you' : 'you_owe',
    });
  }

  return result;
}
