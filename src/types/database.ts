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
  currency: string;
  description: string | null;
  date: string;
  created_at: string;
  installments_total: number;
  installment_number: number;
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
  updated_at: string;
}

export interface BudgetWithCategory extends Budget {
  category: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalWithStats extends SavingsGoal {
  percentage: number | null;
  monthly_avg: number;
  months_to_goal: number | null;
}

export interface SavingsSummary {
  total_saved: number;
  total_ars: number;
  total_usd: number;
  monthly_avg: number;
  goals: SavingsGoalWithStats[];
}
