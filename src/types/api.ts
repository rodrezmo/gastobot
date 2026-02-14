import type { CategoryType, TransactionType, Category } from './database.ts';

export interface CreateTransactionParams {
  category_id: string;
  amount: number;
  type: TransactionType;
  description?: string;
  date: string;
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

export interface ReportData {
  total_income: number;
  total_expense: number;
  balance: number;
  by_category: { category: Category; total: number }[];
  by_date: { date: string; income: number; expense: number }[];
}
