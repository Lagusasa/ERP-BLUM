export type TipoProducto = 'producto' | 'servicio' | 'materia_prima'
export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste' | 'traslado'

export const TIPO_PRODUCTO_LABELS: Record<TipoProducto, string> = {
  producto: 'Producto',
  servicio: 'Servicio',
  materia_prima: 'Materia Prima',
}

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  traslado: 'Traslado',
}

export interface Producto {
  id: string
  empresa_id: string
  sku: string
  nombre: string
  descripcion: string | null
  categoria_id: string | null
  unidad_id: string | null
  tipo: TipoProducto
  precio_compra: number
  precio_venta: number
  stock_minimo: number
  afecto_iva: boolean
  is_active: boolean
  created_at: string
  categoria?: { nombre: string } | null
  unidad?: { codigo: string; nombre: string } | null
  stock?: StockBodega[]
}

export interface StockBodega {
  id: string
  producto_id: string
  bodega_id: string
  cantidad: number
  costo_prom: number
  bodega?: { nombre: string } | null
}

export interface MovimientoInventario {
  id: string
  empresa_id: string
  producto_id: string
  bodega_id: string
  tipo: TipoMovimiento
  cantidad: number
  costo_unitario: number
  total: number
  stock_resultante: number
  referencia_tabla: string | null
  referencia_id: string | null
  glosa: string | null
  created_at: string
  created_by: string | null
  producto?: Pick<Producto, 'sku' | 'nombre'> | null
  bodega?: { nombre: string } | null
}

export interface Bodega {
  id: string
  empresa_id: string
  codigo: string
  nombre: string
  ubicacion: string | null
  is_active: boolean
}

export interface CategoriaProducto {
  id: string
  empresa_id: string
  nombre: string
  descripcion: string | null
}

export interface UnidadMedida {
  id: string
  empresa_id: string
  codigo: string
  nombre: string
}
