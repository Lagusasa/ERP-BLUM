export type TipoDte = '33' | '34' | '39' | '52' | '61' | '56'
export type EstadoDte = 'pendiente' | 'aceptado' | 'rechazado' | 'anulado'
export type TipoBoleta = 'emitida' | 'recibida'
export type AmbienteSii = 'certificacion' | 'produccion'

export const TIPO_DTE_LABELS: Record<TipoDte, string> = {
  '33': 'Factura Electrónica',
  '34': 'Factura No Afecta',
  '39': 'Boleta Electrónica',
  '52': 'Guía de Despacho',
  '61': 'Nota de Crédito',
  '56': 'Nota de Débito',
}

export const ESTADO_DTE_LABELS: Record<EstadoDte, string> = {
  pendiente: 'Pendiente',
  aceptado:  'Aceptado',
  rechazado: 'Rechazado',
  anulado:   'Anulado',
}

export interface DteDocumento {
  id: string
  empresa_id: string
  tipo_dte: TipoDte
  folio: number
  rut_contraparte: string
  razon_social: string | null
  fecha_emision: string
  monto_neto: number
  monto_iva: number
  monto_total: number
  estado: EstadoDte
  xml_raw: string | null
  track_id: string | null
  referencia_id: string | null
  created_at: string
}

export interface F22Declaracion {
  id: string
  empresa_id: string
  anio_tributario: number
  estado: 'borrador' | 'enviado' | 'aceptado'
  folio_sii: string | null
  fecha_envio: string | null
  datos_json: Record<string, number>
  created_at: string
}

export interface BoletaHonorarios {
  id: string
  empresa_id: string
  tipo: TipoBoleta
  numero: number
  rut_prestador: string
  nombre_prestador: string
  rut_pagador: string
  nombre_pagador: string | null
  fecha: string
  monto_bruto: number
  retencion_10: number
  monto_liquido: number
  concepto: string | null
  estado: 'vigente' | 'anulada'
  created_at: string
}

export interface SiiConfig {
  id: string
  empresa_id: string
  ambiente: AmbienteSii
  rut_empresa: string
  razon_social: string
  actividades: Array<{ codigo: number; descripcion: string; afecta_iva: boolean }>
  created_at: string
}

export interface F22Lineas {
  resultado_contable: number
  agregados: number
  deducidos: number
  rli: number
  tasa: number
  impuesto_determinado: number
  ppme: number          // Pagos provisionales mensuales
  retenciones: number
  impuesto_pagar: number
  impuesto_devolver: number
}
