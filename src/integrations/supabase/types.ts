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
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          space_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          space_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          space_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      list_shares: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          share_code: string
          shopping_list_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          share_code: string
          shopping_list_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          share_code?: string
          shopping_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_shares_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          default_quantity: number
          id: string
          name: string
          space_id: string
          unit: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          default_quantity?: number
          id?: string
          name: string
          space_id: string
          unit: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          default_quantity?: number
          id?: string
          name?: string
          space_id?: string
          unit?: string
          user_id?: string | null
        }
        Relationships: []
      }
      saved_list_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_needed: number
          saved_list_id: string
          space_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_needed?: number
          saved_list_id: string
          space_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_needed?: number
          saved_list_id?: string
          space_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_list_items_saved_list_id_fkey"
            columns: ["saved_list_id"]
            isOneToOne: false
            referencedRelation: "saved_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          space_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          space_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          space_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shared_spaces: {
        Row: {
          color_index: number
          created_at: string
          id: string
          is_personal: boolean
          name: string
          owner_id: string
        }
        Insert: {
          color_index?: number
          created_at?: string
          id?: string
          is_personal?: boolean
          name: string
          owner_id: string
        }
        Update: {
          color_index?: number
          created_at?: string
          id?: string
          is_personal?: boolean
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          created_at: string
          id: string
          is_checked: boolean
          notes: string | null
          product_id: string
          quantity_needed: number
          shopping_list_id: string
          sort_order: number | null
          space_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_checked?: boolean
          notes?: string | null
          product_id: string
          quantity_needed?: number
          shopping_list_id: string
          sort_order?: number | null
          space_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_checked?: boolean
          notes?: string | null
          product_id?: string
          quantity_needed?: number
          shopping_list_id?: string
          sort_order?: number | null
          space_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          category_order: string[]
          completed_at: string | null
          created_at: string
          group_by_category: boolean
          id: string
          is_completed: boolean
          name: string
          notes: string | null
          space_id: string
          user_id: string | null
        }
        Insert: {
          category_order?: string[]
          completed_at?: string | null
          created_at?: string
          group_by_category?: boolean
          id?: string
          is_completed?: boolean
          name: string
          notes?: string | null
          space_id: string
          user_id?: string | null
        }
        Update: {
          category_order?: string[]
          completed_at?: string | null
          created_at?: string
          group_by_category?: boolean
          id?: string
          is_completed?: boolean
          name?: string
          notes?: string | null
          space_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      space_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invite_code: string
          space_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invite_code: string
          space_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invite_code?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_invites_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "shared_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          id: string
          joined_at: string
          space_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          space_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "shared_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { _code: string }; Returns: string }
      can_manage_list_share: {
        Args: { _list_id: string; _user_id: string }
        Returns: boolean
      }
      get_invite_space: {
        Args: { _code: string }
        Returns: {
          already_member: boolean
          expires_at: string
          space_id: string
          space_name: string
        }[]
      }
      get_shared_list: { Args: { _code: string }; Returns: Json }
      get_space_members: {
        Args: { _space_id: string }
        Returns: {
          email: string
          is_owner: boolean
          joined_at: string
          user_id: string
        }[]
      }
      is_space_member: {
        Args: { _space_id: string; _user_id: string }
        Returns: boolean
      }
      toggle_shared_item: {
        Args: { _checked: boolean; _code: string; _item_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
