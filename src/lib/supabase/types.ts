export type UserRole = 'cliente' | 'asesor' | 'admin'
export type CaseStatus = 'active' | 'closed' | 'archived'
export type TicketStatus = 'open' | 'in_progress' | 'closed'
export type SubStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
        }
        Update: {
          role?: UserRole
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      cases: {
        Row: {
          id: string
          client_id: string
          asesor_id: string | null
          status: CaseStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          asesor_id?: string | null
          status?: CaseStatus
        }
        Update: {
          asesor_id?: string | null
          status?: CaseStatus
        }
        Relationships: [
          { foreignKeyName: 'cases_client_id_fkey'; columns: ['client_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'cases_asesor_id_fkey'; columns: ['asesor_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      case_data: {
        Row: {
          id: string
          case_id: string
          start_date: string | null
          salary_daily: number | null
          work_days: string | null
          work_hours_paper: string | null
          work_hours_real: string | null
          has_imss: boolean
          has_contract: boolean
          position: string | null
          employer_name: string | null
          address: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          case_id: string
          start_date?: string | null
          salary_daily?: number | null
          work_days?: string | null
          work_hours_paper?: string | null
          work_hours_real?: string | null
          has_imss?: boolean
          has_contract?: boolean
          position?: string | null
          employer_name?: string | null
          address?: string | null
          notes?: string | null
        }
        Update: {
          start_date?: string | null
          salary_daily?: number | null
          work_days?: string | null
          work_hours_paper?: string | null
          work_hours_real?: string | null
          has_imss?: boolean
          has_contract?: boolean
          position?: string | null
          employer_name?: string | null
          address?: string | null
          notes?: string | null
        }
        Relationships: [
          { foreignKeyName: 'case_data_case_id_fkey'; columns: ['case_id']; referencedRelation: 'cases'; referencedColumns: ['id'] },
        ]
      }
      evidence: {
        Row: {
          id: string
          case_id: string
          category: string
          file_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          gps_lat: number | null
          gps_lng: number | null
          gps_accuracy: number | null
          device_time: string | null
          server_time: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          case_id: string
          category: string
          file_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_accuracy?: number | null
          device_time?: string | null
          metadata?: Record<string, unknown>
        }
        Update: {
          metadata?: Record<string, unknown>
        }
        Relationships: [
          { foreignKeyName: 'evidence_case_id_fkey'; columns: ['case_id']; referencedRelation: 'cases'; referencedColumns: ['id'] },
        ]
      }
      tickets: {
        Row: {
          id: string
          case_id: string
          client_id: string
          asesor_id: string | null
          question: string
          response: string | null
          status: TicketStatus
          priority: 'low' | 'medium' | 'high'
          created_at: string
          updated_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          case_id: string
          client_id: string
          asesor_id?: string | null
          question: string
          status?: TicketStatus
          priority?: 'low' | 'medium' | 'high'
        }
        Update: {
          asesor_id?: string | null
          response?: string | null
          status?: TicketStatus
          priority?: 'low' | 'medium' | 'high'
          closed_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'tickets_case_id_fkey'; columns: ['case_id']; referencedRelation: 'cases'; referencedColumns: ['id'] },
        ]
      }
      messages: {
        Row: {
          id: string
          case_id: string | null
          session_id: string | null
          role: 'user' | 'assistant'
          content: string
          is_public: boolean
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          session_id?: string | null
          role: 'user' | 'assistant'
          content: string
          is_public?: boolean
          tokens_used?: number | null
        }
        Update: {
          tokens_used?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
        }
        Update: Record<string, never>
        Relationships: [
          { foreignKeyName: 'chat_messages_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status: SubStatus
          price_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status?: SubStatus
          price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
        }
        Update: {
          status?: SubStatus
          price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
        }
        Relationships: []
      }
      system_config: {
        Row: {
          key: string
          value: string
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          value: string
          description?: string | null
        }
        Update: {
          value?: string
          description?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_data: Record<string, unknown> | null
          new_data: Record<string, unknown> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          old_data?: Record<string, unknown> | null
          new_data?: Record<string, unknown> | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      case_status: CaseStatus
      ticket_status: TicketStatus
      sub_status: SubStatus
    }
    CompositeTypes: Record<string, never>
  }
}
