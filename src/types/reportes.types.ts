export interface BalanceComprobacionLinea {
  codigo: string
  nombre: string
  clase: string
  saldo_normal: string
  total_debe: number
  total_haber: number
  saldo_deudor: number
  saldo_acreedor: number
  balance_debe: number
  balance_haber: number
  resultado_debe: number
  resultado_haber: number
}

export interface FlujoCajaItem {
  categoria: string
  tipo: 'ingreso' | 'egreso'
  total: number
}

export interface FlujoCajaResumen {
  operacion:       { items: FlujoCajaItem[]; neto: number }
  inversion:       { items: FlujoCajaItem[]; neto: number }
  financiamiento:  { items: FlujoCajaItem[]; neto: number }
  variacion_neta: number
  saldo_inicial:  number
  saldo_final:    number
}

export interface ResultadoItem {
  codigo: string
  nombre: string
  monto: number
}

export interface EstadoResultados {
  ingresos: ResultadoItem[]
  costos: ResultadoItem[]
  gastos: ResultadoItem[]
  total_ingresos: number
  total_costos: number
  total_gastos: number
  resultado_bruto: number
  resultado_neto: number
}

export interface BalanceItem {
  codigo: string
  nombre: string
  saldo: number
}

export interface BalanceGeneral {
  activos: BalanceItem[]
  pasivos: BalanceItem[]
  patrimonio: BalanceItem[]
  total_activo: number
  total_pasivo: number
  total_patrimonio: number
  diferencia: number
}

export interface RliAjuste {
  id: string
  empresa_id: string
  anio: number
  tipo: 'agrega' | 'deduce'
  concepto: string
  monto: number
  created_at: string
}

export interface RliResumen {
  resultado_contable: number
  total_agrega: number
  total_deduce: number
  rli: number
  tasa: number
  impuesto: number
  ajustes: RliAjuste[]
}

export interface ConfigContable {
  empresa_id: string
  cuenta_iva_cf_id: string | null
  cuenta_iva_df_id: string | null
  cuenta_cxc_id: string | null
  cuenta_cxp_id: string | null
  cuenta_ingreso_id: string | null
  cuenta_gasto_id: string | null
}

// ── RAZONES FINANCIERAS ──────────────────────────────────────

export interface RazonesFinancierasData {
  activo_corriente:      number
  activo_no_corriente:   number
  inventarios:           number
  pasivo_corriente:      number
  liquidez_corriente:    number | null
  prueba_acida:          number | null
  endeudamiento:         number | null
  endeudamiento_patrimonio: number | null
  roa:                   number | null
  roe:                   number | null
  margen_bruto:          number | null
  margen_neto:           number | null
  total_activo:          number
  total_pasivo:          number
  total_patrimonio:      number
  resultado_neto:        number
  total_ingresos:        number
}

// ── ANTIGÜEDAD DE SALDOS ─────────────────────────────────────

export type AntiguedadBucket = '0-30' | '31-60' | '61-90' | '90+'

export interface AntiguedadLinea {
  id: string
  numero: string
  rut: string
  nombre: string
  fecha_emision: string
  fecha_vencimiento: string | null
  total: number
  dias_vencido: number
  bucket: AntiguedadBucket
}

export interface AntiguedadTotales {
  '0-30': number
  '31-60': number
  '61-90': number
  '90+': number
  total: number
}

export interface AntiguedadSaldosData {
  cxc: AntiguedadLinea[]
  cxp: AntiguedadLinea[]
  totales_cxc: AntiguedadTotales
  totales_cxp: AntiguedadTotales
}

// ── PRESUPUESTO VS REAL ──────────────────────────────────────

export interface PresupuestoLinea {
  cuenta_id: string
  codigo: string
  nombre: string
  clase: string
  presupuesto: number[]
  real: number[]
  total_presupuesto: number
  total_real: number
  variacion: number
  variacion_pct: number
}
