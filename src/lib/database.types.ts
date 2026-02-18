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
      shared_transactions: {
        Row: {
          id: string;
          transaction_id: string;
          owner_id: string;
          split_method: 'equal' | 'custom' | 'percentage';
          total_amount: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          owner_id: string;
          split_method?: 'equal' | 'custom' | 'percentage';
          total_amount: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          owner_id?: string;
          split_method?: 'equal' | 'custom' | 'percentage';
          total_amount?: number;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shared_transactions_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shared_transactions_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      shared_transaction_participants: {
        Row: {
          id: string;
          shared_transaction_id: string;
          user_id: string;
          amount: number;
          percentage: number | null;
          status: 'pending' | 'accepted' | 'rejected';
          created_transaction_id: string | null;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shared_transaction_id: string;
          user_id: string;
          amount: number;
          percentage?: number | null;
          status?: 'pending' | 'accepted' | 'rejected';
          created_transaction_id?: string | null;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shared_transaction_id?: string;
          user_id?: string;
          amount?: number;
          percentage?: number | null;
          status?: 'pending' | 'accepted' | 'rejected';
          created_transaction_id?: string | null;
          responded_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shared_transaction_participants_shared_transaction_id_fkey';
            columns: ['shared_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'shared_transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shared_transaction_participants_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shared_transaction_participants_created_transaction_id_fkey';
            columns: ['created_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          creator_id: string;
          status: 'active' | 'settled' | 'archived';
          currency: string;
          created_at: string;
          settled_at: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          creator_id: string;
          status?: 'active' | 'settled' | 'archived';
          currency?: string;
          created_at?: string;
          settled_at?: string | null;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          creator_id?: string;
          status?: 'active' | 'settled' | 'archived';
          currency?: string;
          created_at?: string;
          settled_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_expenses: {
        Row: {
          id: string;
          group_id: string;
          paid_by: string;
          amount: number;
          description: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          paid_by: string;
          amount: number;
          description: string;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          paid_by?: string;
          amount?: number;
          description?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_expenses_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_expenses_paid_by_fkey';
            columns: ['paid_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      settlements: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          group_id: string | null;
          shared_transaction_id: string | null;
          status: 'pending' | 'confirmed';
          note: string | null;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          group_id?: string | null;
          shared_transaction_id?: string | null;
          status?: 'pending' | 'confirmed';
          note?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          amount?: number;
          group_id?: string | null;
          shared_transaction_id?: string | null;
          status?: 'pending' | 'confirmed';
          note?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'settlements_from_user_id_fkey';
            columns: ['from_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'settlements_to_user_id_fkey';
            columns: ['to_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'settlements_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'settlements_shared_transaction_id_fkey';
            columns: ['shared_transaction_id'];
            isOneToOne: false;
            referencedRelation: 'shared_transactions';
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
      search_users_by_email: {
        Args: { search_email: string };
        Returns: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
        }[];
      };
      respond_to_shared_expense: {
        Args: { p_participant_id: string; p_status: string };
        Returns: undefined;
      };
      create_shared_transaction: {
        Args: {
          p_transaction_id: string;
          p_split_method: string;
          p_total_amount: number;
          p_note: string | null;
          p_participants: { user_id: string; amount: number; percentage: number | null }[];
        };
        Returns: string;
      };
      get_pending_shared_expenses: {
        Args: Record<string, never>;
        Returns: {
          participant_id: string;
          participant_amount: number;
          participant_percentage: number | null;
          participant_status: string;
          shared_id: string;
          split_method: string;
          total_amount: number;
          note: string | null;
          shared_created_at: string;
          owner_id: string;
          owner_email: string;
          owner_full_name: string | null;
          owner_avatar_url: string | null;
          tx_id: string;
          tx_description: string | null;
          tx_amount: number;
          tx_type: string;
          tx_date: string;
          tx_category_name: string | null;
          tx_category_icon: string | null;
          tx_category_color: string | null;
        }[];
      };
      get_my_shared_expenses: {
        Args: Record<string, never>;
        Returns: {
          shared_id: string;
          split_method: string;
          total_amount: number;
          note: string | null;
          shared_created_at: string;
          tx_id: string;
          tx_description: string | null;
          tx_amount: number;
          tx_type: string;
          tx_date: string;
          tx_category_name: string | null;
          participant_id: string;
          participant_user_id: string;
          participant_amount: number;
          participant_percentage: number | null;
          participant_status: string;
          participant_email: string;
          participant_full_name: string | null;
        }[];
      };
      create_group_with_members: {
        Args: {
          p_name: string;
          p_description: string | null;
          p_member_emails: string[];
          p_currency?: string;
        };
        Returns: string;
      };
      get_user_groups: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_group_detail: {
        Args: { p_group_id: string };
        Returns: Json;
      };
      add_member_to_group: {
        Args: { p_group_id: string; p_email: string };
        Returns: undefined;
      };
    };
    Enums: {
      category_type: 'income' | 'expense';
      transaction_type: 'income' | 'expense';
      budget_period: 'weekly' | 'monthly';
      split_method: 'equal' | 'custom' | 'percentage';
      participant_status: 'pending' | 'accepted' | 'rejected';
      group_status: 'active' | 'settled' | 'archived';
      group_role: 'admin' | 'member';
      settlement_status: 'pending' | 'confirmed';
    };
    CompositeTypes: Record<string, never>;
  };
}
