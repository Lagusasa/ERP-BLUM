export type EstadoDocumentoCompra = 'pendiente' | 'contabilizado' | 'pagado' | 'anulado'
export type EstadoDocumentoVenta = 'emitido' | 'contabilizado' | 'cobrado' | 'anulado'

export interface TipoDocumento {
  id: string
  codigo: string
  nombre: string
  abreviatura: string
  afecto_iva: boolean
  es_compra: boolean
  es_venta: boolean
  es_electronico: boolean
  orden: number
}

export interface Proveedor {
  id: string
  empresa_id: string
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
  contacto_nombre: string | null
  contacto_email: string | null
  condicion_pago: number
  cuenta_contable_id: string | null
  notas: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  empresa_id: string
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
  contacto_nombre: string | null
  contacto_email: string | null
  condicion_pago: number
  limite_credito: number | null
  cuenta_contable_id: string | null
  notas: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentoCompra {
  id: string
  empresa_id: string
  proveedor_id: string
  tipo_documento_id: string
  numero_documento: string
  fecha_emision: string
  fecha_vencimiento: string | null
  fecha_recepcion: string | null
  periodo_id: string | null
  neto: number
  iva: number
  exento: number
  total: number
  tasa_iva: number
  es_afecto: boolean
  estado: EstadoDocumentoCompra
  comprobante_id: string | null
  referencia: string | null
  glosa: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  proveedor?: Proveedor
  tipo_documento?: TipoDocumento
}

export interface DocumentoVenta {
  id: string
  empresa_id: string
  cliente_id: string
  tipo_documento_id: string
  numero_documento: string
  fecha_emision: string
  fecha_vencimiento: string | null
  periodo_id: string | null
  neto: number
  iva: number
  exento: number
  total: number
  tasa_iva: number
  es_afecto: boolean
  estado: EstadoDocumentoVenta
  comprobante_id: string | null
  referencia: string | null
  glosa: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  cliente?: Cliente
  tipo_documento?: TipoDocumento
}

export const ESTADO_COMPRA_LABELS: Record<EstadoDocumentoCompra, string> = {
  pendiente: 'Pendiente',
  contabilizado: 'Contabilizado',
  pagado: 'Pagado',
  anulado: 'Anulado',
}

export const ESTADO_VENTA_LABELS: Record<EstadoDocumentoVenta, string> = {
  emitido: 'Emitido',
  contabilizado: 'Contabilizado',
  cobrado: 'Cobrado',
  anulado: 'Anulado',
}
