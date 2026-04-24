import { supabase } from '@/lib/supabase.ts';
import type { SavingsSummary, SavingsGoal } from '@/types/database.ts';
import type { UpsertSavingsGoalParams, RecordSavingsParams } from '@/types/api.ts';

export async function getSavingsSummary(): Promise<SavingsSummary> {
  const { data, error } = await supabase.rpc('get_savings_summary');
  if (error) throw error;
  return data as unknown as SavingsSummary;
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SavingsGoal[];
}

export async function upsertSavingsGoal(params: UpsertSavingsGoalParams): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const payload = {
    user_id: user.id,
    name: params.name,
    target_amount: params.target_amount ?? null,
    target_date: params.target_date ?? null,
    updated_at: new Date().toISOString(),
  };

  if (params.id) {
    const { error } = await supabase
      .from('savings_goals')
      .update(payload)
      .eq('id', params.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('savings_goals')
      .insert(payload);
    if (error) throw error;
  }
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id);
  if (error) throw error;
}

export async function recordSavingsEntry(params: RecordSavingsParams): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  // Buscar la categoría Ahorro del usuario
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', 'ahorro')
    .limit(1);
  if (catError) throw catError;
  if (!categories || categories.length === 0) throw new Error('No se encontró la categoría Ahorro');
  const categoryId = categories[0].id;

  // Transacción principal: el ahorro en la moneda elegida
  const { error: e1 } = await supabase.from('transactions').insert({
    user_id: user.id,
    category_id: categoryId,
    amount: params.amount,
    type: 'expense',
    currency: params.currency,
    description: params.description ?? null,
    date: params.date,
    installments_total: 1,
    installment_number: 1,
  });
  if (e1) throw e1;

  // Si había costo en ARS (compró USD con pesos), registrar el gasto ARS también
  if (params.currency === 'USD' && params.ars_cost && params.ars_cost > 0) {
    const { error: e2 } = await supabase.from('transactions').insert({
      user_id: user.id,
      category_id: categoryId,
      amount: params.ars_cost,
      type: 'expense',
      currency: 'ARS',
      description: params.description ? `${params.description} (ARS)` : 'Compra de USD',
      date: params.date,
      installments_total: 1,
      installment_number: 1,
    });
    if (e2) throw e2;
  }
}
