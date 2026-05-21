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
      empresas: {
        Row: {
          id: string
          rut: string
          razon_social: string
          nombre_fantasia: string | null
          giro: string | null
          direccion: string | null
          comuna: string | null
          ciudad: string | null
          region: string | null
          telefono: string | null
          email: string | null
          representante_legal: string | null
          rut_representante: string | null
          actividad_economica: string | null
          plan_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          logo_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['empresas']['Insert']>
      }
      perfiles: {
        Row: {
          id: string
          user_id: string
          nombre: string
          apellido: string
          email: string
          telefono: string | null
          avatar_url: string | null
          is_active: boolean
          is_superadmin: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['perfiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['perfiles']['Insert']>
      }
      empresa_usuarios: {
        Row: {
          id: string
          empresa_id: string
          user_id: string
          rol_id: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['empresa_usuarios']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['empresa_usuarios']['Insert']>
      }
      roles: {
        Row: {
          id: string
          empresa_id: string | null
          nombre: string
          descripcion: string | null
          es_sistema: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
      }
      permisos: {
        Row: {
          id: string
          modulo: string
          accion: string
          recurso: string
          descripcion: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['permisos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['permisos']['Insert']>
      }
      rol_permisos: {
        Row: {
          id: string
          rol_id: string
          permiso_id: string
          created_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['rol_permisos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rol_permisos']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
