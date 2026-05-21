export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Makes properties with `| null` optional in Insert types
type MakeNullOptional<T> = {
  [K in keyof T as null extends T[K] ? never : K]: T[K]
} & {
  [K in keyof T as null extends T[K] ? K : never]?: T[K]
}

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
          actividad_economica: string | null
          direccion: string | null
          comuna: string | null
          ciudad: string | null
          region: string | null
          telefono: string | null
          email: string | null
          representante_legal: string | null
          rut_representante: string | null
          plan_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
          created_by: string | null
          logo_url: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['empresas']['Row'], 'id' | 'created_at'>>
        Relationships: []
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
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['perfiles']['Row'], 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['perfiles']['Row'], 'created_at'>>
        Relationships: []
      }
      empresa_usuarios: {
        Row: {
          id: string
          empresa_id: string
          user_id: string
          rol_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['empresa_usuarios']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['empresa_usuarios']['Row'], 'id' | 'created_at'>>
        Relationships: []
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
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'>>
        Relationships: []
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
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['permisos']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['permisos']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      rol_permisos: {
        Row: {
          id: string
          rol_id: string
          permiso_id: string
          created_at: string
          created_by: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['rol_permisos']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['rol_permisos']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      centros_costo: {
        Row: {
          id: string
          empresa_id: string
          codigo: string
          nombre: string
          descripcion: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['centros_costo']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['centros_costo']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      plan_cuentas: {
        Row: {
          id: string
          empresa_id: string | null
          codigo: string
          nombre: string
          clase: string
          tipo: string
          saldo_normal: string
          nivel: number
          cuenta_padre_id: string | null
          es_imputable: boolean
          es_activo: boolean
          permite_ajuste: boolean
          created_at: string
          updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['plan_cuentas']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['plan_cuentas']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      periodos_contables: {
        Row: {
          id: string
          empresa_id: string
          anio: number
          mes: number
          estado: string
          fecha_apertura: string | null
          fecha_cierre: string | null
          created_at: string
          updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['periodos_contables']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['periodos_contables']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      comprobantes: {
        Row: {
          id: string
          empresa_id: string
          numero: number
          tipo: string
          estado: string
          fecha: string
          periodo_id: string | null
          glosa: string | null
          referencia: string | null
          total_debe: number
          total_haber: number
          created_at: string
          updated_at: string
          created_by: string | null
          aprobado_by: string | null
          aprobado_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['comprobantes']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['comprobantes']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      comprobante_lineas: {
        Row: {
          id: string
          comprobante_id: string
          empresa_id: string
          cuenta_id: string
          centro_costo_id: string | null
          debe: number
          haber: number
          glosa: string | null
          orden: number
          created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['comprobante_lineas']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['comprobante_lineas']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      correlativo_comprobantes: {
        Row: {
          empresa_id: string
          anio: number
          ultimo_numero: number
        }
        Insert: Database['public']['Tables']['correlativo_comprobantes']['Row']
        Update: Partial<Database['public']['Tables']['correlativo_comprobantes']['Insert']>
        Relationships: []
      }
      proveedores: {
        Row: {
          id: string
          empresa_id: string
          rut: string
          razon_social: string
          nombre_fantasia: string | null
          giro: string | null
          email: string | null
          telefono: string | null
          direccion: string | null
          comuna: string | null
          ciudad: string | null
          condicion_pago: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['proveedores']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['proveedores']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          empresa_id: string
          rut: string
          razon_social: string
          nombre_fantasia: string | null
          giro: string | null
          email: string | null
          telefono: string | null
          direccion: string | null
          comuna: string | null
          ciudad: string | null
          limite_credito: number | null
          condicion_pago: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      tipos_documento: {
        Row: {
          id: string
          codigo: string
          nombre: string
          abreviatura: string | null
          afecto_iva: boolean
          afecta_iva_debito: boolean
          afecta_iva_credito: boolean
          es_nota_credito: boolean
          es_nota_debito: boolean
          is_active: boolean
          created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['tipos_documento']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['tipos_documento']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      documentos_compra: {
        Row: {
          id: string
          empresa_id: string
          proveedor_id: string
          tipo_documento_id: string
          numero_documento: string
          fecha_emision: string
          fecha_vencimiento: string | null
          neto: number
          exento: number
          tasa_iva: number
          es_afecto: boolean
          iva: number
          total: number
          referencia: string | null
          glosa: string | null
          estado: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['documentos_compra']['Row'], 'id' | 'created_at' | 'updated_at' | 'iva' | 'total'>>
        Update: Partial<Omit<Database['public']['Tables']['documentos_compra']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      documentos_venta: {
        Row: {
          id: string
          empresa_id: string
          cliente_id: string
          tipo_documento_id: string
          numero_documento: string
          fecha_emision: string
          fecha_vencimiento: string | null
          neto: number
          exento: number
          tasa_iva: number
          es_afecto: boolean
          iva: number
          total: number
          referencia: string | null
          glosa: string | null
          estado: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['documentos_venta']['Row'], 'id' | 'created_at' | 'updated_at' | 'iva' | 'total'>>
        Update: Partial<Omit<Database['public']['Tables']['documentos_venta']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      trabajadores: {
        Row: {
          id: string
          empresa_id: string
          rut: string
          nombre: string
          apellido_paterno: string
          apellido_materno: string | null
          fecha_nacimiento: string | null
          genero: string | null
          estado_civil: string | null
          nacionalidad: string | null
          email: string | null
          telefono: string | null
          direccion: string | null
          comuna: string | null
          ciudad: string | null
          afp_id: string | null
          isapre_id: string | null
          tipo_afiliacion: string
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['trabajadores']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['trabajadores']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      afp: {
        Row: {
          id: string
          nombre: string
          tasa: number
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['afp']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['afp']['Insert']>
        Relationships: []
      }
      isapres: {
        Row: {
          id: string
          nombre: string
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['isapres']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['isapres']['Insert']>
        Relationships: []
      }
      contratos: {
        Row: {
          id: string
          empresa_id: string
          trabajador_id: string
          tipo_contrato: string
          cargo: string | null
          departamento: string | null
          fecha_inicio: string
          fecha_termino: string | null
          sueldo_base: number
          jornada_horas: number
          gratificacion_tipo: string
          es_activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['contratos']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['contratos']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      liquidaciones: {
        Row: {
          id: string
          empresa_id: string
          trabajador_id: string
          contrato_id: string | null
          periodo_mes: number
          periodo_anio: number
          estado: string
          sueldo_base: number
          horas_extra: number
          valor_hora_extra: number
          monto_horas_extra: number
          gratificacion: number
          otros_haberes_impon: number
          total_imponible: number
          asig_movilizacion: number
          asig_colacion: number
          viaticos: number
          otros_no_imponibles: number
          total_no_imponible: number
          afp_tasa: number
          afp_monto: number
          isapre_monto: number
          seguro_cesantia: number
          impuesto_2da_cat: number
          otros_descuentos: number
          total_descuentos: number
          sueldo_liquido: number
          aporte_scs: number
          aporte_mutualidad: number
          aporte_seguro_ces_emp: number
          dias_trabajados: number
          observaciones: string | null
          fecha_pago: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['liquidaciones']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['liquidaciones']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      config_contable: {
        Row: {
          empresa_id: string
          cuenta_iva_cf_id: string | null
          cuenta_iva_df_id: string | null
          cuenta_cxc_id: string | null
          cuenta_cxp_id: string | null
          cuenta_ingreso_id: string | null
          cuenta_gasto_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['config_contable']['Row'], 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['config_contable']['Row'], never>>
        Relationships: []
      }
      declaraciones_f29: {
        Row: {
          id: string
          empresa_id: string
          periodo_mes: number
          periodo_anio: number
          estado: string
          debito_ventas_afectas: number
          debito_notas_credito: number
          debito_notas_debito: number
          total_debito_fiscal: number
          credito_compras: number
          credito_activo_fijo: number
          credito_notas_credito: number
          credito_notas_debito: number
          total_credito_fiscal: number
          iva_a_pagar: number
          remanente_credito: number
          ppm_base_imponible: number
          ppm_tasa: number
          ppm_monto: number
          total_a_pagar: number
          fecha_presentacion: string | null
          folio_sii: string | null
          observaciones: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['declaraciones_f29']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['declaraciones_f29']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      importar_plan_cuentas_template: {
        Args: { p_empresa_id: string }
        Returns: undefined
      }
      siguiente_numero_comprobante: {
        Args: { p_empresa_id: string; p_anio: number }
        Returns: number
      }
      calcular_f29: {
        Args: { p_empresa_id: string; p_mes: number; p_anio: number }
        Returns: { debito_fiscal: number; credito_fiscal: number; iva_a_pagar: number; remanente: number }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
