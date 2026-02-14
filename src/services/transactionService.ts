import { supabase } from '@/lib/supabase.ts';
import type { TransactionWithCategory } from '@/types/database.ts';
import type {
  TransactionFilters,
  CreateTransactionParams,
  UpdateTransactionParams,
} from '@/types/api.ts';

export async function getTransactions(
  filters?: TransactionFilters,
): Promise<TransactionWithCategory[]> {
  let query = supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .order('date', { ascending: false });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.category_id) query = query.eq('category_id', filters.category_id);
  if (filters?.date_from) query = query.gte('date', filters.date_from);
  if (filters?.date_to) query = query.lte('date', filters.date_to);
  if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data as TransactionWithCategory[];
}

export async function getTransaction(id: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as TransactionWithCategory;
}

export async function createTransaction(params: CreateTransactionParams) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...params, user_id: session.user.id })
    .select('*, category:categories(*)')
    .single();
  if (error) throw error;
  return data as TransactionWithCategory;
}

export async function updateTransaction(id: string, params: UpdateTransactionParams) {
  const { data, error } = await supabase
    .from('transactions')
    .update(params)
    .eq('id', id)
    .select('*, category:categories(*)')
    .single();
  if (error) throw error;
  return data as TransactionWithCategory;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
