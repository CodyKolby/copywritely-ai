export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      payment_logs: {
        Row: {
          created_at: string
          customer: string | null
          customer_email: string | null
          id: string
          session_id: string
          subscription_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer?: string | null
          customer_email?: string | null
          id?: string
          session_id: string
          subscription_id?: string | null
          timestamp: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer?: string | null
          customer_email?: string | null
          id?: string
          session_id?: string
          subscription_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          subscription_expiry: string | null
          subscription_id: string | null
          subscription_status: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_premium?: boolean | null
          subscription_expiry?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          subscription_expiry?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          content: string | null
          created_at: string
          id: string
          metadata: Json | null
          platform: string | null
          status: Database["public"]["Enums"]["project_status"]
          subject: string | null
          subtype: string | null
          target_audience_id: string | null
          title: string
          title_auto_generated: boolean | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          subject?: string | null
          subtype?: string | null
          target_audience_id?: string | null
          title: string
          title_auto_generated?: boolean | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          subject?: string | null
          subtype?: string | null
          target_audience_id?: string | null
          title?: string
          title_auto_generated?: boolean | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      target_audiences: {
        Row: {
          age_range: string
          beliefs: string
          benefits: string[]
          biography: string
          competitors: string[]
          created_at: string
          desires: string[]
          experience: string
          gender: string
          id: string
          language: string
          main_offer: string
          name: string
          offer_details: string
          pains: string[]
          updated_at: string
          user_id: string
          why_it_works: string
        }
        Insert: {
          age_range: string
          beliefs: string
          benefits: string[]
          biography: string
          competitors: string[]
          created_at?: string
          desires: string[]
          experience: string
          gender: string
          id?: string
          language: string
          main_offer: string
          name: string
          offer_details: string
          pains: string[]
          updated_at?: string
          user_id: string
          why_it_works: string
        }
        Update: {
          age_range?: string
          beliefs?: string
          benefits?: string[]
          biography?: string
          competitors?: string[]
          created_at?: string
          desires?: string[]
          experience?: string
          gender?: string
          id?: string
          language?: string
          main_offer?: string
          name?: string
          offer_details?: string
          pains?: string[]
          updated_at?: string
          user_id?: string
          why_it_works?: string
        }
        Relationships: []
      }
      unprocessed_payments: {
        Row: {
          created_at: string
          id: string
          processed: boolean
          processed_at: string | null
          session_data: Json
          session_id: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          session_data: Json
          session_id: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          session_data?: Json
          session_id?: string
          timestamp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_full_name: string
          user_avatar_url: string
        }
        Returns: undefined
      }
    }
    Enums: {
      project_status: "Draft" | "Completed" | "Reviewed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      project_status: ["Draft", "Completed", "Reviewed"],
    },
  },
} as const
