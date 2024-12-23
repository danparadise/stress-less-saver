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
      bank_statement_data: {
        Row: {
          created_at: string
          document_id: string
          ending_balance: number | null
          id: string
          statement_month: string
          total_deposits: number | null
          total_withdrawals: number | null
          transactions: Json | null
        }
        Insert: {
          created_at?: string
          document_id: string
          ending_balance?: number | null
          id?: string
          statement_month: string
          total_deposits?: number | null
          total_withdrawals?: number | null
          transactions?: Json | null
        }
        Update: {
          created_at?: string
          document_id?: string
          ending_balance?: number | null
          id?: string
          statement_month?: string
          total_deposits?: number | null
          total_withdrawals?: number | null
          transactions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_statement_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "financial_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          month_year: string
          notes: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          month_year: string
          notes?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          month_year?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_financial_summaries: {
        Row: {
          created_at: string | null
          ending_balance: number | null
          id: string
          month_year: string
          paystub_data: Json | null
          total_deposits: number | null
          total_expenses: number | null
          total_income: number | null
          total_withdrawals: number | null
          transaction_categories: Json | null
          transactions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ending_balance?: number | null
          id?: string
          month_year: string
          paystub_data?: Json | null
          total_deposits?: number | null
          total_expenses?: number | null
          total_income?: number | null
          total_withdrawals?: number | null
          transaction_categories?: Json | null
          transactions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ending_balance?: number | null
          id?: string
          month_year?: string
          paystub_data?: Json | null
          total_deposits?: number | null
          total_expenses?: number | null
          total_income?: number | null
          total_withdrawals?: number | null
          transaction_categories?: Json | null
          transactions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      paystub_data: {
        Row: {
          created_at: string
          document_id: string
          extracted_data: Json | null
          gross_pay: number | null
          id: string
          net_pay: number | null
          pay_period_end: string | null
          pay_period_start: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          extracted_data?: Json | null
          gross_pay?: number | null
          id?: string
          net_pay?: number | null
          pay_period_end?: string | null
          pay_period_start?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          extracted_data?: Json | null
          gross_pay?: number | null
          id?: string
          net_pay?: number | null
          pay_period_end?: string | null
          pay_period_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paystub_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "financial_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          founder_code: string | null
          id: string
          last_name: string | null
          subscription_status: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          founder_code?: string | null
          id: string
          last_name?: string | null
          subscription_status?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          founder_code?: string | null
          id?: string
          last_name?: string | null
          subscription_status?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_monthly_summaries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      bank_statement_status:
        | "pending"
        | "pending_conversion"
        | "completed"
        | "failed"
      document_status: "pending" | "pending_conversion" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
