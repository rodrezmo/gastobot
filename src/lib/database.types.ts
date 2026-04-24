export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bot_sessions: {
        Row: {
          context: Json | null
          phone: string
          state: string
          updated_at: string
        }
        Insert: {
          context?: Json | null
          phone: string
          state?: string
          updated_at?: string
        }
        Update: {
          context?: Json | null
          phone?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          end_date: string | null
          id: string
          period: Database["public"]["Enums"]["budget_period"]
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          period?: Database["public"]["Enums"]["budget_period"]
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          period?: Database["public"]["Enums"]["budget_period"]
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_default: boolean
          name: string
          type: Database["public"]["Enums"]["category_type"]
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name: string
          type?: Database["public"]["Enums"]["category_type"]
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name?: string
          type?: Database["public"]["Enums"]["category_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          group_id: string
          id: string
          paid_by: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          description: string
          group_id: string
          id?: string
          paid_by: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          group_id?: string
          id?: string
          paid_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          archived_at: string | null
          created_at: string
          creator_id: string
          currency: string
          description: string | null
          id: string
          name: string
          settled_at: string | null
          status: Database["public"]["Enums"]["group_status"]
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          settled_at?: string | null
          status?: Database["public"]["Enums"]["group_status"]
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          settled_at?: string | null
          status?: Database["public"]["Enums"]["group_status"]
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      linking_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linking_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_links: {
        Row: {
          created_at: string
          id: string
          phone: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          email: string
          full_name: string | null
          id: string
          nickname: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email: string
          full_name?: string | null
          id: string
          nickname?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          email?: string
          full_name?: string | null
          id?: string
          nickname?: string | null
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          created_at: string
          id: string
          name: string
          target_amount: number | null
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          target_amount?: number | null
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          target_amount?: number | null
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          from_user_id: string
          group_id: string | null
          id: string
          note: string | null
          shared_transaction_id: string | null
          status: Database["public"]["Enums"]["settlement_status"]
          to_user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          from_user_id: string
          group_id?: string | null
          id?: string
          note?: string | null
          shared_transaction_id?: string | null
          status?: Database["public"]["Enums"]["settlement_status"]
          to_user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          from_user_id?: string
          group_id?: string | null
          id?: string
          note?: string | null
          shared_transaction_id?: string | null
          status?: Database["public"]["Enums"]["settlement_status"]
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_shared_transaction_id_fkey"
            columns: ["shared_transaction_id"]
            isOneToOne: false
            referencedRelation: "shared_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_transaction_participants: {
        Row: {
          amount: number
          created_at: string
          created_transaction_id: string | null
          id: string
          percentage: number | null
          responded_at: string | null
          shared_transaction_id: string
          status: Database["public"]["Enums"]["participant_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_transaction_id?: string | null
          id?: string
          percentage?: number | null
          responded_at?: string | null
          shared_transaction_id: string
          status?: Database["public"]["Enums"]["participant_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_transaction_id?: string | null
          id?: string
          percentage?: number | null
          responded_at?: string | null
          shared_transaction_id?: string
          status?: Database["public"]["Enums"]["participant_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_transaction_participants_created_transaction_id_fkey"
            columns: ["created_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_transaction_participants_shared_transaction_id_fkey"
            columns: ["shared_transaction_id"]
            isOneToOne: false
            referencedRelation: "shared_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_transaction_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_transactions: {
        Row: {
          created_at: string
          id: string
          note: string | null
          owner_id: string
          split_method: Database["public"]["Enums"]["split_method"]
          total_amount: number
          transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          owner_id: string
          split_method?: Database["public"]["Enums"]["split_method"]
          total_amount: number
          transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          owner_id?: string
          split_method?: Database["public"]["Enums"]["split_method"]
          total_amount?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_transactions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          installment_number: number
          installments_total: number
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          installment_number?: number
          installments_total?: number
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          installment_number?: number
          installments_total?: number
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_member_to_group: {
        Args: { p_email: string; p_group_id: string }
        Returns: undefined
      }
      add_member_to_group_by_id: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: undefined
      }
      create_group_with_member_ids: {
        Args: {
          p_currency?: string
          p_description: string
          p_member_ids: string[]
          p_name: string
        }
        Returns: string
      }
      create_group_with_members: {
        Args: {
          p_currency?: string
          p_description: string
          p_member_emails: string[]
          p_name: string
        }
        Returns: string
      }
      create_shared_transaction: {
        Args: {
          p_note: string
          p_participants: Json
          p_split_method: string
          p_total_amount: number
          p_transaction_id: string
        }
        Returns: string
      }
      get_balance: {
        Args: { p_user_id: string }
        Returns: {
          balance: number
          total_expense: number
          total_income: number
        }[]
      }
      get_budget_summary: {
        Args: { p_month: string }
        Returns: {
          budget_id: string
          category_color: string
          category_id: string
          category_name: string
          limit_amount: number
          percentage: number
          spent_amount: number
        }[]
      }
      get_category_breakdown: {
        Args: { p_date_from: string; p_date_to: string; p_user_id: string }
        Returns: {
          category_color: string
          category_icon: string
          category_id: string
          category_name: string
          category_type: Database["public"]["Enums"]["category_type"]
          total: number
          transaction_count: number
        }[]
      }
      get_group_detail: { Args: { p_group_id: string }; Returns: Json }
      get_monthly_summary: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          balance: number
          total_expense: number
          total_income: number
          transaction_count: number
        }[]
      }
      get_monthly_trend: {
        Args: { p_months?: number; p_user_id: string }
        Returns: {
          balance: number
          month_year: string
          total_expense: number
          total_income: number
        }[]
      }
      get_my_contacts: {
        Args: never
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          masked_email: string
          nickname: string
        }[]
      }
      get_my_shared_expenses: {
        Args: never
        Returns: {
          note: string
          participant_amount: number
          participant_email: string
          participant_full_name: string
          participant_id: string
          participant_percentage: number
          participant_status: string
          participant_user_id: string
          shared_created_at: string
          shared_id: string
          split_method: string
          total_amount: number
          tx_amount: number
          tx_category_name: string
          tx_date: string
          tx_description: string
          tx_id: string
          tx_type: string
        }[]
      }
      get_pending_shared_expenses: {
        Args: never
        Returns: {
          note: string
          owner_avatar_url: string
          owner_email: string
          owner_full_name: string
          owner_id: string
          participant_amount: number
          participant_id: string
          participant_percentage: number
          participant_status: string
          shared_created_at: string
          shared_id: string
          split_method: string
          total_amount: number
          tx_amount: number
          tx_category_color: string
          tx_category_icon: string
          tx_category_name: string
          tx_date: string
          tx_description: string
          tx_id: string
          tx_type: string
        }[]
      }
      get_savings_summary: { Args: never; Returns: Json }
      get_user_groups: { Args: never; Returns: Json }
      respond_to_shared_expense: {
        Args: { p_participant_id: string; p_status: string }
        Returns: undefined
      }
      save_contact: { Args: { p_contact_id: string }; Returns: undefined }
      search_users_by_email: {
        Args: { search_email: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id: string
        }[]
      }
      search_users_by_nickname: {
        Args: { search_query: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          masked_email: string
          nickname: string
        }[]
      }
    }
    Enums: {
      budget_period: "weekly" | "monthly"
      category_type: "income" | "expense"
      group_role: "admin" | "member"
      group_status: "active" | "settled" | "archived"
      participant_status: "pending" | "accepted" | "rejected"
      settlement_status: "pending" | "confirmed"
      split_method: "equal" | "custom" | "percentage"
      transaction_type: "income" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      budget_period: ["weekly", "monthly"],
      category_type: ["income", "expense"],
      group_role: ["admin", "member"],
      group_status: ["active", "settled", "archived"],
      participant_status: ["pending", "accepted", "rejected"],
      settlement_status: ["pending", "confirmed"],
      split_method: ["equal", "custom", "percentage"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
