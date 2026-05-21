export type TipoCuenta = 'corriente' | 'ahorro' | 'vista' | 'credito'
export type TipoMovCaja = 'ingreso' | 'egreso'

export const TIPO_CUENTA_LABELS: Record<TipoCuenta, string> = {
  corriente: 'Cuenta Corriente',
  ahorro:    'Cuenta Ahorro',
  vista:     'Cuenta Vista',
  credito:   'Línea de Crédito',
}

export const CATEGORIAS_INGRESO = [
  'cobranza_clientes', 'prestamo', 'aporte_capital', 'interes', 'otros_ingresos',
]
export const CATEGORIAS_EGRESO = [
  'pago_proveedores', 'remuneraciones', 'impuestos', 'arriendo', 'servicios',
  'gastos_financieros', 'inversion', 'otros_egresos',
]
export const CATEGORIA_LABELS: Record<string, string> = {
  cobranza_clientes: 'Cobranza Clientes',
  prestamo:          'Préstamo',
  aporte_capital:    'Aporte de Capital',
  interes:           'Interés / Rendimiento',
  otros_ingresos:    'Otros Ingresos',
  pago_proveedores:  'Pago Proveedores',
  remuneraciones:    'Remuneraciones',
  impuestos:         'Impuestos',
  arriendo:          'Arriendo',
  servicios:         'Servicios / Utilities',
  gastos_financieros:'Gastos Financieros',
  inversion:         'Inversión',
  otros_egresos:     'Otros Egresos',
}

export interface CuentaBancaria {
  id: string
  empresa_id: string
  banco: string
  tipo_cuenta: TipoCuenta
  numero_cuenta: string
  moneda: string
  saldo_inicial: number
  saldo_actual: number
  is_active: boolean
}

export interface MovimientoCaja {
  id: string
  empresa_id: string
  cuenta_id: string
  tipo: TipoMovCaja
  categoria: string
  descripcion: string
  monto: number
  fecha: string
  referencia: string | null
  conciliado: boolean
  referencia_tabla: string | null
  referencia_id: string | null
  created_at: string
  cuenta?: Pick<CuentaBancaria, 'banco' | 'numero_cuenta'> | null
}

export interface ProyeccionCaja {
  id: string
  empresa_id: string
  fecha: string
  tipo: TipoMovCaja
  categoria: string
  descripcion: string
  monto: number
  es_recurrente: boolean
  periodicidad: string | null
}

export interface ResumenCaja {
  saldo_total: number
  ingresos_mes: number
  egresos_mes: number
  flujo_neto: number
  cuentas: Array<CuentaBancaria & { ingresos: number; egresos: number }>
}
