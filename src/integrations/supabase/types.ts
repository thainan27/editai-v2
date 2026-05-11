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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      client_reviews: {
        Row: {
          brief_clarity: number
          client_id: string
          comment: string | null
          communication: number
          created_at: string
          editor_id: string
          id: string
          order_id: string
          rating: number
        }
        Insert: {
          brief_clarity: number
          client_id: string
          comment?: string | null
          communication: number
          created_at?: string
          editor_id: string
          id?: string
          order_id: string
          rating: number
        }
        Update: {
          brief_clarity?: number
          client_id?: string
          comment?: string | null
          communication?: number
          created_at?: string
          editor_id?: string
          id?: string
          order_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          opened_by: string
          order_id: string
          q1_answer: string | null
          q1_type: string | null
          q2_answer: string | null
          q2_type: string | null
          reason: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          opened_by: string
          order_id: string
          q1_answer?: string | null
          q1_type?: string | null
          q2_answer?: string | null
          q2_type?: string | null
          reason: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          opened_by?: string
          order_id?: string
          q1_answer?: string | null
          q1_type?: string | null
          q2_answer?: string | null
          q2_type?: string | null
          reason?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      editor_profiles: {
        Row: {
          accepts_recurrent: boolean
          accepts_sos: boolean
          base_price: number
          bio: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_verified: boolean
          level: Database["public"]["Enums"]["editor_level"]
          libre_since: string
          portfolio_links: Json
          rating_avg: number
          rating_count: number
          specialty: string
          status: Database["public"]["Enums"]["editor_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          accepts_recurrent?: boolean
          accepts_sos?: boolean
          base_price?: number
          bio?: string | null
          created_at?: string
          id: string
          is_featured?: boolean
          is_verified?: boolean
          level?: Database["public"]["Enums"]["editor_level"]
          libre_since?: string
          portfolio_links?: Json
          rating_avg?: number
          rating_count?: number
          specialty: string
          status?: Database["public"]["Enums"]["editor_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          accepts_recurrent?: boolean
          accepts_sos?: boolean
          base_price?: number
          bio?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          level?: Database["public"]["Enums"]["editor_level"]
          libre_since?: string
          portfolio_links?: Json
          rating_avg?: number
          rating_count?: number
          specialty?: string
          status?: Database["public"]["Enums"]["editor_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      editor_reviews: {
        Row: {
          client_id: string
          comment: string | null
          communication: number
          created_at: string
          deadline_score: number
          editor_id: string
          id: string
          order_id: string
          rating: number
        }
        Insert: {
          client_id: string
          comment?: string | null
          communication: number
          created_at?: string
          deadline_score: number
          editor_id: string
          id?: string
          order_id: string
          rating: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          communication?: number
          created_at?: string
          deadline_score?: number
          editor_id?: string
          id?: string
          order_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "editor_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          file_url: string | null
          id: string
          order_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          order_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          order_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          brief_locked_at: string | null
          briefing: string
          client_id: string
          created_at: string
          deadline: string | null
          delivery_url: string | null
          duration_minutes: number | null
          editor_amount: number
          editor_id: string
          id: string
          max_revisions: number
          package_name: string
          platform_fee: number
          references_text: string | null
          revision_count: number
          revision_locked: boolean
          scope_change_requested: boolean
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          video_type: string
        }
        Insert: {
          brief_locked_at?: string | null
          briefing: string
          client_id: string
          created_at?: string
          deadline?: string | null
          delivery_url?: string | null
          duration_minutes?: number | null
          editor_amount: number
          editor_id: string
          id?: string
          max_revisions?: number
          package_name: string
          platform_fee: number
          references_text?: string | null
          revision_count?: number
          revision_locked?: boolean
          scope_change_requested?: boolean
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
          video_type: string
        }
        Update: {
          brief_locked_at?: string | null
          briefing?: string
          client_id?: string
          created_at?: string
          deadline?: string | null
          delivery_url?: string | null
          duration_minutes?: number | null
          editor_amount?: number
          editor_id?: string
          id?: string
          max_revisions?: number
          package_name?: string
          platform_fee?: number
          references_text?: string | null
          revision_count?: number
          revision_locked?: boolean
          scope_change_requested?: boolean
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          video_type?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          editor_amount: number
          id: string
          mp_payment_id: string | null
          order_id: string
          platform_fee: number
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          editor_amount: number
          id?: string
          mp_payment_id?: string | null
          order_id: string
          platform_fee: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          editor_amount?: number
          id?: string
          mp_payment_id?: string | null
          order_id?: string
          platform_fee?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          cancellation_count: number
          client_score: number
          client_score_count: number
          created_at: string
          dispute_count: number
          full_name: string
          id: string
          phone: string | null
          total_orders: number
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          cancellation_count?: number
          client_score?: number
          client_score_count?: number
          created_at?: string
          dispute_count?: number
          full_name: string
          id: string
          phone?: string | null
          total_orders?: number
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          cancellation_count?: number
          client_score?: number
          client_score_count?: number
          created_at?: string
          dispute_count?: number
          full_name?: string
          id?: string
          phone?: string | null
          total_orders?: number
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          editor_id: string
          id: string
          order_id: string
          rating: number
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          editor_id: string
          id?: string
          order_id: string
          rating: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          editor_id?: string
          id?: string
          order_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cliente" | "editor"
      editor_level: "basico" | "intermediario" | "avancado"
      editor_status: "pendente" | "aprovado" | "rejeitado"
      order_status:
        | "aguardando_aceite"
        | "aceito"
        | "em_andamento"
        | "em_revisao"
        | "concluido"
        | "cancelado"
        | "recusado"
      payment_status: "pendente" | "pago" | "liberado" | "reembolsado"
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
      app_role: ["admin", "cliente", "editor"],
      editor_level: ["basico", "intermediario", "avancado"],
      editor_status: ["pendente", "aprovado", "rejeitado"],
      order_status: [
        "aguardando_aceite",
        "aceito",
        "em_andamento",
        "em_revisao",
        "concluido",
        "cancelado",
        "recusado",
      ],
      payment_status: ["pendente", "pago", "liberado", "reembolsado"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.98.2 (currently installed v2.98.1)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
