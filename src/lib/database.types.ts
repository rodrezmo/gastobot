export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          currency: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          type: 'income' | 'expense';
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string;
          color?: string;
          type?: 'income' | 'expense';
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          color?: string;
          type?: 'income' | 'expense';
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          type: 'income' | 'expense';
          description: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          type: 'income' | 'expense';
          description?: string | null;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          type?: 'income' | 'expense';
          description?: string | null;
          date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          period: 'weekly' | 'monthly';
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          period?: 'weekly' | 'monthly';
          start_date: string;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          period?: 'weekly' | 'monthly';
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'budgets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budgets_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_monthly_summary: {
        Args: { p_user_id: string; p_year: number; p_month: number };
        Returns: {
          total_income: number;
          total_expense: number;
          balance: number;
          transaction_count: number;
        }[];
      };
      get_category_breakdown: {
        Args: { p_user_id: string; p_date_from: string; p_date_to: string };
        Returns: {
          category_id: string;
          category_name: string;
          category_icon: string;
          category_color: string;
          category_type: 'income' | 'expense';
          total: number;
          transaction_count: number;
        }[];
      };
      get_monthly_trend: {
        Args: { p_user_id: string; p_months?: number };
        Returns: {
          month_year: string;
          total_income: number;
          total_expense: number;
          balance: number;
        }[];
      };
      get_balance: {
        Args: { p_user_id: string };
        Returns: {
          total_income: number;
          total_expense: number;
          balance: number;
        }[];
      };
    };
    Enums: {
      category_type: 'income' | 'expense';
      transaction_type: 'income' | 'expense';
      budget_period: 'weekly' | 'monthly';
    };
    CompositeTypes: Record<string, never>;
  };
}
