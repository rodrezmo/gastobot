import { supabase } from '@/lib/supabase.ts';
import type { ReportData } from '@/types/api.ts';
import type { TransactionWithCategory } from '@/types/database.ts';

export async function getReport(dateFrom: string, dateTo: string): Promise<ReportData> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: true });

  if (error) throw error;
  const transactions = data as TransactionWithCategory[];

  const total_income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const total_expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<string, { category: TransactionWithCategory['category']; total: number }>();
  for (const t of transactions.filter((t) => t.type === 'expense')) {
    const existing = categoryMap.get(t.category_id);
    if (existing) {
      existing.total += t.amount;
    } else {
      categoryMap.set(t.category_id, { category: t.category, total: t.amount });
    }
  }

  const dateMap = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const existing = dateMap.get(t.date) ?? { income: 0, expense: 0 };
    if (t.type === 'income') existing.income += t.amount;
    else existing.expense += t.amount;
    dateMap.set(t.date, existing);
  }

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
    by_category: Array.from(categoryMap.values()),
    by_date: Array.from(dateMap.entries()).map(([date, vals]) => ({ date, ...vals })),
  };
}

export async function getMonthlySummary(userId: string, year: number, month: number) {
  const { data, error } = await supabase.rpc('get_monthly_summary', {
    p_user_id: userId,
    p_year: year,
    p_month: month,
  });
  if (error) throw error;
  return data?.[0] ?? { total_income: 0, total_expense: 0, balance: 0, transaction_count: 0 };
}

export async function getCategoryBreakdown(userId: string, dateFrom: string, dateTo: string) {
  const { data, error } = await supabase.rpc('get_category_breakdown', {
    p_user_id: userId,
    p_date_from: dateFrom,
    p_date_to: dateTo,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getMonthlyTrend(userId: string, months: number = 6) {
  const { data, error } = await supabase.rpc('get_monthly_trend', {
    p_user_id: userId,
    p_months: months,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getBalance(userId: string) {
  const { data, error } = await supabase.rpc('get_balance', {
    p_user_id: userId,
  });
  if (error) throw error;
  return data?.[0] ?? { total_income: 0, total_expense: 0, balance: 0 };
}
