export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense';
export type BudgetPeriod = 'weekly' | 'monthly';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  nickname: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  created_at: string;
}
