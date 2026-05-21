export type EstadoDocumentoCompra = 'pendiente' | 'contabilizado' | 'pagado' | 'anulado'
export type EstadoDocumentoVenta = 'emitido' | 'contabilizado' | 'cobrado' | 'anulado'

export interface TipoDocumento {
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
  telefono: string | null
  email: string | null
  condicion_pago: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
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
  telefono: string | null
  email: string | null
  limite_credito: number | null
  condicion_pago: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DocumentoCompra {
  id: string
  empresa_id: string
  proveedor_id: string
  tipo_documento_id: string
  numero_documento: string
  fecha_emision: string
  fecha_vencimiento: string | null
  neto: number
  iva: number
  exento: number
  total: number
  tasa_iva: number
  es_afecto: boolean
  estado: EstadoDocumentoCompra
  referencia: string | null
  glosa: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
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
  neto: number
  iva: number
  exento: number
  total: number
  tasa_iva: number
  es_afecto: boolean
  estado: EstadoDocumentoVenta
  referencia: string | null
  glosa: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
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
