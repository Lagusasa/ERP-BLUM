export type ClaseCuenta = 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'costo' | 'gasto' | 'orden'
export type TipoCuenta = 'encabezado' | 'detalle'
export type SaldoNormal = 'deudor' | 'acreedor'
export type EstadoComprobante = 'borrador' | 'aprobado' | 'anulado'
export type TipoComprobante = 'diario' | 'compras' | 'ventas' | 'remuneraciones' | 'apertura' | 'cierre' | 'ajuste' | 'traslado' | 'correccion'
export type EstadoPeriodo = 'abierto' | 'cerrado' | 'bloqueado'

export interface PlanCuenta {
  id: string
  empresa_id: string | null
  cuenta_padre_id: string | null
  codigo: string
  nombre: string
  clase: ClaseCuenta
  tipo: TipoCuenta
  nivel: number
  saldo_normal: SaldoNormal
  es_imputable: boolean
  is_active: boolean
  permite_ajuste: boolean
  created_at: string
  updated_at: string
  hijos?: PlanCuenta[]
}

export interface CentroCosto {
  id: string
  empresa_id: string
  codigo: string
  nombre: string
  descripcion: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PeriodoContable {
  id: string
  empresa_id: string
  anio: number
  mes: number
  estado: EstadoPeriodo
  fecha_apertura: string | null
  fecha_cierre: string | null
  created_at: string
  updated_at: string
}

export interface ComprobanteLinia {
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
  cuenta?: PlanCuenta
  centro_costo?: CentroCosto | null
}

export interface Comprobante {
  id: string
  empresa_id: string
  periodo_id: string | null
  numero: number
  tipo: TipoComprobante
  fecha: string
  glosa: string | null
  referencia: string | null
  estado: EstadoComprobante
  total_debe: number
  total_haber: number
  created_at: string
  updated_at: string
  created_by: string | null
  aprobado_by: string | null
  aprobado_at: string | null
  lineas?: ComprobanteLinia[]
  periodo?: PeriodoContable | null
}

// Para el formulario de nuevo comprobante
export interface ComprobanteLineaForm {
  cuenta_id: string
  cuenta_codigo?: string
  cuenta_nombre?: string
  centro_costo_id: string
  debe: number
  haber: number
  glosa: string
}

export interface ComprobanteForm {
  tipo: TipoComprobante
  fecha: string
  glosa: string
  lineas: ComprobanteLineaForm[]
}

// Para el libro mayor
export interface LibroMayorMovimiento {
  fecha: string
  numero_comprobante: number
  tipo_comprobante: TipoComprobante
  glosa: string
  debe: number
  haber: number
  saldo: number
}

export interface LibroMayorCuenta {
  cuenta: PlanCuenta
  saldo_inicial: number
  movimientos: LibroMayorMovimiento[]
  total_debe: number
  total_haber: number
  saldo_final: number
}

// Balance de 8 columnas
export interface Balance8ColumnasLinia {
  cuenta: PlanCuenta
  suma_debe: number
  suma_haber: number
  saldo_deudor: number
  saldo_acreedor: number
  resultado_debe: number
  resultado_haber: number
  balance_debe: number
  balance_haber: number
}

export const TIPO_COMPROBANTE_LABELS: Record<TipoComprobante, string> = {
  diario: 'Diario',
  compras: 'Compras',
  ventas: 'Ventas',
  remuneraciones: 'Remuneraciones',
  apertura: 'Apertura',
  cierre: 'Cierre',
  ajuste: 'Ajuste',
  traslado: 'Traslado',
  correccion: 'Corrección',
}

export const CLASE_CUENTA_LABELS: Record<ClaseCuenta, string> = {
  activo: 'Activo',
  pasivo: 'Pasivo',
  patrimonio: 'Patrimonio',
  ingreso: 'Ingreso',
  costo: 'Costo',
  gasto: 'Gasto',
  orden: 'Orden',
}

export const ESTADO_COMPROBANTE_LABELS: Record<EstadoComprobante, string> = {
  borrador: 'Borrador',
  aprobado: 'Aprobado',
  anulado: 'Anulado',
}
