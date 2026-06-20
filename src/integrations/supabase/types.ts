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
      analysis_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          message: string | null
          progress: number
          result: Json | null
          status: Database["public"]["Enums"]["analysis_job_status"]
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          progress?: number
          result?: Json | null
          status?: Database["public"]["Enums"]["analysis_job_status"]
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          progress?: number
          result?: Json | null
          status?: Database["public"]["Enums"]["analysis_job_status"]
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      analysis_usage: {
        Row: {
          analyzed_at: string
          id: string
          month: string
          user_id: string
          username_analyzed: string
        }
        Insert: {
          analyzed_at?: string
          id?: string
          month?: string
          user_id: string
          username_analyzed: string
        }
        Update: {
          analyzed_at?: string
          id?: string
          month?: string
          user_id?: string
          username_analyzed?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          code: string
          created_at: string
          description_en: string
          description_es: string
          icon: string
          id: string
          name_en: string
          name_es: string
          sort_order: number
          tier: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description_en: string
          description_es: string
          icon: string
          id?: string
          name_en: string
          name_es: string
          sort_order?: number
          tier?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description_en?: string
          description_es?: string
          icon?: string
          id?: string
          name_en?: string
          name_es?: string
          sort_order?: number
          tier?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          read_at: string | null
          type: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          read_at?: string | null
          type: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          read_at?: string | null
          type?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          github_username: string | null
          id: string
          public_profile: boolean
        }
        Insert: {
          created_at?: string
          email: string
          github_username?: string | null
          id: string
          public_profile?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          github_username?: string | null
          id?: string
          public_profile?: boolean
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_code: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_code: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_code?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_code_fkey"
            columns: ["badge_code"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_badge: {
        Args: { _badge_code: string; _user_id: string }
        Returns: boolean
      }
      check_and_award_badges: { Args: { _user_id: string }; Returns: undefined }
      get_monthly_analysis_count: {
        Args: { _user_id: string }
        Returns: number
      }
      get_profile_visibility: {
        Args: { _github_username: string }
        Returns: {
          owner_role: Database["public"]["Enums"]["app_role"]
          public_profile: boolean
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      analysis_job_status:
        | "queued"
        | "running"
        | "partial"
        | "complete"
        | "error"
      app_role: "free" | "pro" | "pro_recruiter"
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
      analysis_job_status: [
        "queued",
        "running",
        "partial",
        "complete",
        "error",
      ],
      app_role: ["free", "pro", "pro_recruiter"],
    },
  },
} as const
