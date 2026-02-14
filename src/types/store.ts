import type { Profile, Category, TransactionWithCategory } from './database.ts';
import type {
  CreateTransactionParams,
  UpdateTransactionParams,
  CreateCategoryParams,
  TransactionFilters,
} from './api.ts';

export interface Session {
  access_token: string;
  user: { id: string; email?: string };
}

export interface AuthState {
  user: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export interface TransactionState {
  transactions: TransactionWithCategory[];
  loading: boolean;
  filters: TransactionFilters;
  fetchTransactions: () => Promise<void>;
  addTransaction: (params: CreateTransactionParams) => Promise<void>;
  updateTransaction: (id: string, params: UpdateTransactionParams) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
}

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (params: CreateCategoryParams) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}
