import type { CategoryType, TransactionType, Category } from './database.ts';

export interface CreateTransactionParams {
  category_id: string;
  amount: number;
  type: TransactionType;
  currency?: string;
  description?: string;
  date: string;
  installments_total?: number;
}

export interface RecordSavingsParams {
  currency: 'ARS' | 'USD';
  amount: number;
  date: string;
  description?: string;
  // Solo si currency=USD: cuántos ARS usaste para comprarlo
  ars_cost?: number;
}

export type UpdateTransactionParams = Partial<CreateTransactionParams>;

export interface CreateCategoryParams {
  name: string;
  icon?: string;
  color?: string;
  type: CategoryType;
}

export interface TransactionFilters {
  type?: TransactionType;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface UpsertBudgetParams {
  category_id: string;
  amount: number;
}

export interface BudgetSummaryItem {
  budget_id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  limit_amount: number;
  spent_amount: number;
  percentage: number;
}

export interface UpsertSavingsGoalParams {
  id?: string;
  name: string;
  target_amount?: number | null;
  target_date?: string | null;
}

export interface ReportData {
  total_income: number;
  total_expense: number;
  balance: number;
  by_category: { category: Category; total: number }[];
  by_date: { date: string; income: number; expense: number }[];
}
