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
      assignments: {
        Row: {
          created_at: string
          id: string
          sk_user_id: string
          village_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sk_user_id: string
          village_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sk_user_id?: string
          village_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      local_records: {
        Row: {
          apr_cases: number
          aug_cases: number
          created_at: string
          dec_cases: number
          feb_cases: number
          hh: number
          id: string
          itn_2023: number
          itn_2024: number
          itn_2025: number
          jan_cases: number
          jul_cases: number
          jun_cases: number
          mar_cases: number
          may_cases: number
          nov_cases: number
          oct_cases: number
          population: number
          reporting_year: number
          sep_cases: number
          sk_user_id: string
          updated_at: string
          village_id: string
        }
        Insert: {
          apr_cases?: number
          aug_cases?: number
          created_at?: string
          dec_cases?: number
          feb_cases?: number
          hh?: number
          id?: string
          itn_2023?: number
          itn_2024?: number
          itn_2025?: number
          jan_cases?: number
          jul_cases?: number
          jun_cases?: number
          mar_cases?: number
          may_cases?: number
          nov_cases?: number
          oct_cases?: number
          population?: number
          reporting_year?: number
          sep_cases?: number
          sk_user_id: string
          updated_at?: string
          village_id: string
        }
        Update: {
          apr_cases?: number
          aug_cases?: number
          created_at?: string
          dec_cases?: number
          feb_cases?: number
          hh?: number
          id?: string
          itn_2023?: number
          itn_2024?: number
          itn_2025?: number
          jan_cases?: number
          jul_cases?: number
          jun_cases?: number
          mar_cases?: number
          may_cases?: number
          nov_cases?: number
          oct_cases?: number
          population?: number
          reporting_year?: number
          sep_cases?: number
          sk_user_id?: string
          updated_at?: string
          village_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_records_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      non_local_records: {
        Row: {
          apr_cases: number
          aug_cases: number
          country: string
          created_at: string
          dec_cases: number
          district_or_state: string
          feb_cases: number
          id: string
          jan_cases: number
          jul_cases: number
          jun_cases: number
          mar_cases: number
          may_cases: number
          nov_cases: number
          oct_cases: number
          reporting_year: number
          sep_cases: number
          sk_user_id: string
          union_name: string
          upazila_or_township: string
          updated_at: string
          village_name: string
        }
        Insert: {
          apr_cases?: number
          aug_cases?: number
          country?: string
          created_at?: string
          dec_cases?: number
          district_or_state?: string
          feb_cases?: number
          id?: string
          jan_cases?: number
          jul_cases?: number
          jun_cases?: number
          mar_cases?: number
          may_cases?: number
          nov_cases?: number
          oct_cases?: number
          reporting_year?: number
          sep_cases?: number
          sk_user_id: string
          union_name?: string
          upazila_or_township?: string
          updated_at?: string
          village_name?: string
        }
        Update: {
          apr_cases?: number
          aug_cases?: number
          country?: string
          created_at?: string
          dec_cases?: number
          district_or_state?: string
          feb_cases?: number
          id?: string
          jan_cases?: number
          jul_cases?: number
          jun_cases?: number
          mar_cases?: number
          may_cases?: number
          nov_cases?: number
          oct_cases?: number
          reporting_year?: number
          sep_cases?: number
          sk_user_id?: string
          union_name?: string
          upazila_or_township?: string
          updated_at?: string
          village_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      unions: {
        Row: {
          created_at: string
          id: string
          name: string
          upazila_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          upazila_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          upazila_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unions_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      upazilas: {
        Row: {
          created_at: string
          district_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          district_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          district_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "upazilas_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      villages: {
        Row: {
          created_at: string
          id: string
          name: string
          union_id: string
          ward_no: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          union_id: string
          ward_no?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          union_id?: string
          ward_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "villages_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "sk"
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
      app_role: ["admin", "sk"],
    },
  },
} as const
