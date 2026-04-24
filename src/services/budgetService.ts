import { supabase } from '@/lib/supabase.ts';
import type { BudgetWithCategory } from '@/types/database.ts';
import type { UpsertBudgetParams, BudgetSummaryItem } from '@/types/api.ts';
import { format, startOfMonth } from 'date-fns';

export async function getBudgets(): Promise<BudgetWithCategory[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('period', 'monthly')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as BudgetWithCategory[]).filter((b) => b.category_id !== null);
}

export async function upsertBudget(params: UpsertBudgetParams): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: user.id,
        category_id: params.category_id,
        amount: params.amount,
        period: 'monthly',
        start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,category_id' },
    );

  if (error) throw error;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

export async function getBudgetSummary(month: Date): Promise<BudgetSummaryItem[]> {
  const { data, error } = await supabase.rpc('get_budget_summary', {
    p_month: format(month, 'yyyy-MM-dd'),
  });

  if (error) throw error;
  return (data ?? []) as BudgetSummaryItem[];
}
