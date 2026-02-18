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
  const { error } = await supabase.rpc('create_shared_transaction', {
    p_transaction_id: params.transaction_id,
    p_split_method: params.split_method,
    p_total_amount: params.participants.reduce((sum, p) => sum + p.amount, 0),
    p_note: params.note ?? null,
    p_participants: params.participants.map((p) => ({
      user_id: p.user_id,
      amount: p.amount,
      percentage: p.percentage ?? null,
    })),
  });

  if (error) throw error;
}

export async function getPendingSharedExpenses(): Promise<SharedTransactionWithDetails[]> {
  const { data, error } = await supabase.rpc('get_pending_shared_expenses');
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.shared_id,
    transaction_id: row.tx_id,
    owner_id: row.owner_id,
    split_method: row.split_method,
    total_amount: row.total_amount,
    note: row.note,
    created_at: row.shared_created_at,
    transaction: {
      id: row.tx_id,
      description: row.tx_description,
      amount: row.tx_amount,
      type: row.tx_type,
      date: row.tx_date,
      category: {
        name: row.tx_category_name,
        icon: row.tx_category_icon,
        color: row.tx_category_color,
      },
    },
    owner: {
      id: row.owner_id,
      email: row.owner_email,
      full_name: row.owner_full_name,
      avatar_url: row.owner_avatar_url,
    },
    participants: [
      {
        id: row.participant_id,
        shared_transaction_id: row.shared_id,
        user_id: '', // filled by caller via auth
        amount: row.participant_amount,
        percentage: row.participant_percentage,
        status: row.participant_status,
        created_transaction_id: null,
        responded_at: null,
        created_at: row.shared_created_at,
        user: { id: '', email: '', full_name: null, avatar_url: null },
      },
    ],
  })) as unknown as SharedTransactionWithDetails[];
}

export async function getMySharedExpenses(): Promise<SharedTransactionWithDetails[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('get_my_shared_expenses');
  if (error) throw error;

  // Group rows by shared_id (each participant is a separate row)
  const grouped = new Map<string, SharedTransactionWithDetails>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    let shared = grouped.get(row.shared_id);
    if (!shared) {
      shared = {
        id: row.shared_id,
        transaction_id: row.tx_id,
        owner_id: user.id,
        split_method: row.split_method,
        total_amount: row.total_amount,
        note: row.note,
        created_at: row.shared_created_at,
        transaction: {
          id: row.tx_id,
          description: row.tx_description,
          amount: row.tx_amount,
          type: row.tx_type,
          date: row.tx_date,
        } as SharedTransactionWithDetails['transaction'],
        owner: {
          id: user.id,
          email: user.email ?? '',
          full_name: null,
          avatar_url: null,
        },
        participants: [],
      };
      grouped.set(row.shared_id, shared);
    }
    shared.participants.push({
      id: row.participant_id,
      shared_transaction_id: row.shared_id,
      user_id: row.participant_user_id,
      amount: row.participant_amount,
      percentage: row.participant_percentage,
      status: row.participant_status,
      created_transaction_id: null,
      responded_at: null,
      created_at: row.shared_created_at,
      user: {
        id: row.participant_user_id,
        email: row.participant_email,
        full_name: row.participant_full_name,
        avatar_url: null,
      },
    });
  }

  return Array.from(grouped.values());
}

export async function respondToSharedExpense(
  participantId: string,
  status: 'accepted' | 'rejected',
): Promise<void> {
  const { error } = await supabase.rpc('respond_to_shared_expense', {
    p_participant_id: participantId,
    p_status: status,
  });

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
