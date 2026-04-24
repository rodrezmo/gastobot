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

  const installments = params.installments_total && params.installments_total > 1 ? params.installments_total : 1;

  if (installments === 1) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...params, installments_total: 1, installment_number: 1, user_id: session.user.id })
      .select('*, category:categories(*)')
      .single();
    if (error) throw error;
    return data as TransactionWithCategory;
  }

  // Para cuotas: crear N filas, una por cuota
  const monthlyAmount = Math.round((params.amount / installments) * 100) / 100;
  const baseDate = new Date(params.date + 'T12:00:00');

  const rows = Array.from({ length: installments }, (_, i) => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + i);
    return {
      category_id: params.category_id,
      amount: monthlyAmount,
      type: params.type,
      currency: params.currency ?? 'ARS',
      description: params.description,
      date: d.toISOString().split('T')[0],
      installments_total: installments,
      installment_number: i + 1,
      user_id: session.user.id,
    };
  });

  const { data, error } = await supabase
    .from('transactions')
    .insert(rows)
    .select('*, category:categories(*)')
    .order('installment_number', { ascending: true });
  if (error) throw error;
  // Devolver la primera cuota como representante
  return (data as TransactionWithCategory[])[0];
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
