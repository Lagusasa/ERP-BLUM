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
          is_active: boolean
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
          mutualidad_id: string | null
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
          tasa_afp: number
          comision: number
          sis: number
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['afp']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['afp']['Insert']>
        Relationships: []
      }
      mutualidades: {
        Row: {
          id: string
          nombre: string
          tasa_base: number
          is_active: boolean
          created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['mutualidades']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['mutualidades']['Insert']>
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
          lugar_prestacion: string | null
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
          afp_comision: number
          afp_sis: number
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
      cuentas_bancarias: {
        Row: {
          id: string; empresa_id: string; banco: string; tipo_cuenta: string
          numero_cuenta: string; moneda: string
          saldo_inicial: number; saldo_actual: number; is_active: boolean
          created_at: string; updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['cuentas_bancarias']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['cuentas_bancarias']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      movimientos_caja: {
        Row: {
          id: string; empresa_id: string; cuenta_id: string; tipo: string
          categoria: string; descripcion: string; monto: number; fecha: string
          referencia: string | null; conciliado: boolean
          referencia_tabla: string | null; referencia_id: string | null
          created_at: string; created_by: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['movimientos_caja']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['movimientos_caja']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      proyecciones_caja: {
        Row: {
          id: string; empresa_id: string; fecha: string; tipo: string
          categoria: string; descripcion: string; monto: number
          es_recurrente: boolean; periodicidad: string | null; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['proyecciones_caja']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['proyecciones_caja']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      bodegas: {
        Row: {
          id: string; empresa_id: string; codigo: string; nombre: string
          ubicacion: string | null; is_active: boolean
          created_at: string; updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['bodegas']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['bodegas']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      unidades_medida: {
        Row: { id: string; empresa_id: string; codigo: string; nombre: string; created_at: string }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['unidades_medida']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['unidades_medida']['Insert']>
        Relationships: []
      }
      categorias_producto: {
        Row: { id: string; empresa_id: string; nombre: string; descripcion: string | null; created_at: string }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['categorias_producto']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['categorias_producto']['Insert']>
        Relationships: []
      }
      productos: {
        Row: {
          id: string; empresa_id: string; sku: string; nombre: string; descripcion: string | null
          categoria_id: string | null; unidad_id: string | null
          tipo: string; precio_compra: number; precio_venta: number
          stock_minimo: number; afecto_iva: boolean; is_active: boolean
          created_at: string; updated_at: string; deleted_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['productos']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['productos']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      stock_bodega: {
        Row: {
          id: string; empresa_id: string; producto_id: string; bodega_id: string
          cantidad: number; costo_prom: number; updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['stock_bodega']['Row'], 'id' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['stock_bodega']['Insert']>
        Relationships: []
      }
      movimientos_inventario: {
        Row: {
          id: string; empresa_id: string; producto_id: string; bodega_id: string
          tipo: string; cantidad: number; costo_unitario: number; total: number
          stock_resultante: number; referencia_tabla: string | null; referencia_id: string | null
          glosa: string | null; created_at: string; created_by: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['movimientos_inventario']['Row'], 'id' | 'created_at' | 'total'>>
        Update: Partial<Omit<Database['public']['Tables']['movimientos_inventario']['Row'], 'id' | 'created_at' | 'total'>>
        Relationships: []
      }
      workflow_configs: {
        Row: {
          id: string
          empresa_id: string
          modulo: string
          nombre: string
          descripcion: string | null
          monto_min: number | null
          monto_max: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['workflow_configs']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['workflow_configs']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      workflow_pasos: {
        Row: {
          id: string
          workflow_id: string
          orden: number
          nombre: string
          rol_requerido: string | null
          user_id: string | null
          es_paralelo: boolean
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['workflow_pasos']['Row'], 'id'>>
        Update: Partial<Database['public']['Tables']['workflow_pasos']['Insert']>
        Relationships: []
      }
      workflow_instancias: {
        Row: {
          id: string
          empresa_id: string
          workflow_id: string
          referencia_tabla: string
          referencia_id: string
          estado: string
          paso_actual: number
          iniciado_por: string | null
          creado_at: string
          completado_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['workflow_instancias']['Row'], 'id' | 'creado_at'>>
        Update: Partial<Omit<Database['public']['Tables']['workflow_instancias']['Row'], 'id' | 'creado_at'>>
        Relationships: []
      }
      workflow_decisiones: {
        Row: {
          id: string
          instancia_id: string
          paso_id: string
          user_id: string | null
          decision: string
          comentario: string | null
          created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['workflow_decisiones']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['workflow_decisiones']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      documentos_gestion: {
        Row: {
          id: string
          empresa_id: string
          tipo: string
          nombre: string
          descripcion: string | null
          url_externo: string | null
          storage_path: string | null
          mime_type: string | null
          tamano: number | null
          referencia_tabla: string | null
          referencia_id: string | null
          estado: string
          created_at: string
          updated_at: string
          created_by: string | null
          deleted_at: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['documentos_gestion']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['documentos_gestion']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      rli_ajustes: {
        Row: {
          id: string
          empresa_id: string
          anio: number
          tipo: string
          concepto: string
          monto: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['rli_ajustes']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['rli_ajustes']['Row'], 'id' | 'created_at'>>
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
      dte_documentos: {
        Row: {
          id: string; empresa_id: string; tipo_dte: string; folio: number
          rut_contraparte: string; razon_social: string | null
          fecha_emision: string; monto_neto: number; monto_iva: number; monto_total: number
          estado: string; xml_raw: string | null; track_id: string | null
          referencia_id: string | null; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['dte_documentos']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['dte_documentos']['Insert']>
        Relationships: []
      }
      boletas_honorarios: {
        Row: {
          id: string; empresa_id: string; tipo: string; numero: number
          rut_prestador: string; nombre_prestador: string; rut_pagador: string; nombre_pagador: string | null
          fecha: string; monto_bruto: number; retencion_10: number; monto_liquido: number
          concepto: string | null; estado: string; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['boletas_honorarios']['Row'], 'id' | 'created_at' | 'retencion_10' | 'monto_liquido'>>
        Update: Partial<Database['public']['Tables']['boletas_honorarios']['Insert']>
        Relationships: []
      }
      f22_declaraciones: {
        Row: {
          id: string; empresa_id: string; anio_tributario: number; estado: string
          folio_sii: string | null; fecha_envio: string | null; datos_json: Record<string, number>; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['f22_declaraciones']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['f22_declaraciones']['Insert']>
        Relationships: []
      }
      sii_config: {
        Row: {
          id: string; empresa_id: string; ambiente: string; rut_empresa: string
          razon_social: string; actividades: Json; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['sii_config']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['sii_config']['Insert']>
        Relationships: []
      }
      gastos_lir: {
        Row: {
          id: string; empresa_id: string; cuenta_id: string | null; fecha: string; anio: number
          concepto: string; monto: number; articulo: string; tipo_gasto: string | null
          rut_beneficiario: string | null; nombre_beneficiario: string | null
          is_active: boolean; created_at: string; updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['gastos_lir']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['gastos_lir']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      registros_empresa_sii: {
        Row: {
          id: string; empresa_id: string; tipo: string; anio: number
          concepto: string; monto: number; descripcion: string | null
          is_active: boolean; created_at: string; updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['registros_empresa_sii']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['registros_empresa_sii']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      devolucion_iva_exportador: {
        Row: {
          id: string; empresa_id: string; periodo: string
          monto_iva_exportaciones: number; monto_solicitado: number
          numero_solicitud: string | null; estado: string
          observacion: string | null; is_active: boolean
          created_at: string; updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['devolucion_iva_exportador']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['devolucion_iva_exportador']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      convenios_pago: {
        Row: {
          id: string; empresa_id: string; acreedor: string; tipo: string
          monto_total: number; n_cuotas: number; monto_cuota: number
          fecha_inicio: string; tasa_interes: number; descripcion: string | null
          estado: string; is_active: boolean; created_at: string; updated_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['convenios_pago']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Database['public']['Tables']['convenios_pago']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      convenio_cuotas: {
        Row: {
          id: string; convenio_id: string; empresa_id: string; numero: number
          fecha_vencimiento: string; monto: number; estado: string
          fecha_pago: string | null; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['convenio_cuotas']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['convenio_cuotas']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      registro_asistencia: {
        Row: {
          id: string; empresa_id: string; trabajador_id: string; fecha: string
          hora_entrada: string | null; hora_salida: string | null
          horas_ordinarias: number; horas_extra: number; tipo: string
          observacion: string | null; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['registro_asistencia']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['registro_asistencia']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      pactos_horas_extra: {
        Row: {
          id: string; empresa_id: string; trabajador_id: string
          fecha_inicio: string; fecha_termino: string | null
          horas_semana: number; monto_hora: number; is_active: boolean; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['pactos_horas_extra']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['pactos_horas_extra']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      banco_horas: {
        Row: {
          id: string; empresa_id: string; trabajador_id: string
          periodo_mes: number; periodo_anio: number
          horas_extra: number; horas_usadas: number; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['banco_horas']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['banco_horas']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      ausencias: {
        Row: {
          id: string; empresa_id: string; trabajador_id: string; tipo: string
          fecha_inicio: string; fecha_fin: string; dias_habiles: number; dias_corridos: number
          estado: string; motivo: string | null; numero_licencia: string | null
          documento_url: string | null; aprobado_por: string | null; created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['ausencias']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['ausencias']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      terminaciones_contrato: {
        Row: {
          id: string; empresa_id: string; trabajador_id: string; contrato_id: string
          fecha_termino: string; causal: string; descripcion: string | null
          preaviso_dias: number; indemnizacion_anios: number; indemnizacion_monto: number
          vacaciones_pendientes: number; monto_total_finiquito: number
          ministro_de_fe: string | null; firmado: boolean; fecha_firma: string | null
          created_at: string
        }
        Insert: MakeNullOptional<Omit<Database['public']['Tables']['terminaciones_contrato']['Row'], 'id' | 'created_at'>>
        Update: Partial<Omit<Database['public']['Tables']['terminaciones_contrato']['Row'], 'id' | 'created_at'>>
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
