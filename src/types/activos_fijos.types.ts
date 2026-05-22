export type MetodoDepreciacion = 'lineal' | 'acelerada'
export type EstadoActivo = 'activo' | 'dado_baja' | 'vendido'
export type CategoriaActivo =
  | 'edificios'
  | 'maquinaria'
  | 'vehiculos'
  | 'equipos_computacion'
  | 'mobiliario'
  | 'herramientas'
  | 'otros'

export const CATEGORIA_LABELS: Record<CategoriaActivo, string> = {
  edificios:           'Edificios y Construcciones',
  maquinaria:          'Maquinaria y Equipos',
  vehiculos:           'Vehículos',
  equipos_computacion: 'Equipos de Computación',
  mobiliario:          'Mobiliario y Útiles',
  herramientas:        'Herramientas',
  otros:               'Otros Activos',
}

export const VIDA_UTIL_SII: Record<CategoriaActivo, number> = {
  edificios:           480,  // 40 años
  maquinaria:          180,  // 15 años
  vehiculos:           84,   // 7 años
  equipos_computacion: 72,   // 6 años
  mobiliario:          84,   // 7 años
  herramientas:        60,   // 5 años
  otros:               120,  // 10 años
}

export interface ActivoFijo {
  id: string
  empresa_id: string
  codigo: string
  nombre: string
  descripcion: string | null
  categoria: CategoriaActivo
  fecha_adquisicion: string
  valor_adquisicion: number
  valor_residual: number
  vida_util_meses: number
  metodo: MetodoDepreciacion
  cuenta_activo_id: string | null
  cuenta_dep_acumulada_id: string | null
  cuenta_gasto_dep_id: string | null
  estado: EstadoActivo
  is_active: boolean
  created_at: string
  depreciacion_acumulada?: number
  meses_depreciados?: number
}

export interface DepreciacionPeriodo {
  id: string
  activo_id: string
  empresa_id: string
  anio: number
  mes: number
  monto: number
  comprobante_id: string | null
  created_at: string
}
