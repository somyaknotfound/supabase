export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          username: string
          avatar_url: string | null
          bio: string | null
          credits: number
          level: number
          total_credits_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          credits?: number
          level?: number
          total_credits_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          credits?: number
          level?: number
          total_credits_earned?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: string
          name: string
          category: string
          difficulty_level: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          difficulty_level: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          difficulty_level?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      skill_listings: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          title: string
          description: string | null
          credit_price: number
          duration_minutes: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          title: string
          description?: string | null
          credit_price: number
          duration_minutes?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: string
          title?: string
          description?: string | null
          credit_price?: number
          duration_minutes?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "skill_listings_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          skill_listing_id: string
          transaction_type: string
          description: string | null
          amount: number
          original_amount: number | null
          discount_percentage: number | null
          discount_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_listing_id: string
          transaction_type: string
          description?: string | null
          amount: number
          original_amount?: number | null
          discount_percentage?: number | null
          discount_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_listing_id?: string
          transaction_type?: string
          description?: string | null
          amount?: number
          original_amount?: number | null
          discount_percentage?: number | null
          discount_reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_skill_listing_id_fkey"
            columns: ["skill_listing_id"]
            isOneToOne: false
            referencedRelation: "skill_listings"
            referencedColumns: ["id"]
          }
        ]
      }
      course_chat_rooms: {
        Row: {
          id: string
          student_id: string
          instructor_id: string
          skill_listing_id: string
          room_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          instructor_id: string
          skill_listing_id: string
          room_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          instructor_id?: string
          skill_listing_id?: string
          room_name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_chat_rooms_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_chat_rooms_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          chat_room_id: string
          sender_id: string
          receiver_id: string
          message: string
          message_type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          sender_id: string
          receiver_id: string
          message: string
          message_type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          sender_id?: string
          receiver_id?: string
          message?: string
          message_type?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "course_chat_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      course_progress: {
        Row: {
          id: string
          student_id: string
          skill_listing_id: string
          progress_percent: number
          last_accessed: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          skill_listing_id: string
          progress_percent?: number
          last_accessed?: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          skill_listing_id?: string
          progress_percent?: number
          last_accessed?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_credit_discount: {
        Args: {
          tutor_credits: number
          student_credits: number
        }
        Returns: number
      }
      purchase_skill_with_discount: {
        Args: {
          p_skill_listing_id: string
          p_student_id: string
        }
        Returns: Json
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