import { createClient } from '@/lib/supabase/server'
import type { Producto, Bodega, MovimientoInventario, CategoriaProducto, UnidadMedida } from '@/types/inventario.types'

export async function getProductos(empresa_id: string): Promise<Producto[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      categoria:categorias_producto(nombre),
      unidad:unidades_medida(codigo, nombre),
      stock:stock_bodega(id, bodega_id, cantidad, costo_prom, bodega:bodegas(nombre))
    `)
    .eq('empresa_id', empresa_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('nombre')

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Producto[]
}

export async function getProducto(id: string, empresa_id: string): Promise<Producto | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('productos')
    .select(`
      *,
      categoria:categorias_producto(nombre),
      unidad:unidades_medida(codigo, nombre),
      stock:stock_bodega(id, bodega_id, cantidad, costo_prom, bodega:bodegas(nombre))
    `)
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .maybeSingle()

  return data as unknown as Producto | null
}

export async function createProducto(empresa_id: string, data: Omit<Producto, 'id' | 'empresa_id' | 'created_at' | 'categoria' | 'unidad' | 'stock'>): Promise<Producto> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('productos')
    .insert({ ...data, empresa_id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result as unknown as Producto
}

export async function updateProducto(id: string, empresa_id: string, data: Partial<Omit<Producto, 'id' | 'empresa_id' | 'created_at'>>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('productos')
    .update(data as never)
    .eq('id', id)
    .eq('empresa_id', empresa_id)

  if (error) throw new Error(error.message)
}

export async function getBodegas(empresa_id: string): Promise<Bodega[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bodegas')
    .select('*')
    .eq('empresa_id', empresa_id)
    .eq('is_active', true)
    .order('nombre')

  if (error) throw new Error(error.message)
  return (data ?? []) as Bodega[]
}

export async function getCategorias(empresa_id: string): Promise<CategoriaProducto[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categorias_producto')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('nombre')
  return (data ?? []) as CategoriaProducto[]
}

export async function getUnidades(empresa_id: string): Promise<UnidadMedida[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('unidades_medida')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('codigo')
  return (data ?? []) as UnidadMedida[]
}

export async function getMovimientos(empresa_id: string, producto_id?: string): Promise<MovimientoInventario[]> {
  const supabase = await createClient()
  let query = supabase
    .from('movimientos_inventario')
    .select(`
      *,
      producto:productos(sku, nombre),
      bodega:bodegas(nombre)
    `)
    .eq('empresa_id', empresa_id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (producto_id) query = query.eq('producto_id', producto_id)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as MovimientoInventario[]
}

export async function registrarMovimiento(
  empresa_id: string,
  producto_id: string,
  bodega_id: string,
  tipo: 'entrada' | 'salida' | 'ajuste',
  cantidad: number,
  costo_unitario: number,
  glosa: string | null
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: stockData } = await supabase
    .from('stock_bodega')
    .select('cantidad, costo_prom')
    .eq('producto_id', producto_id)
    .eq('bodega_id', bodega_id)
    .maybeSingle()

  const stockActual = stockData?.cantidad ?? 0
  const costoPrevio = stockData?.costo_prom ?? 0

  let nuevoStock = stockActual
  let nuevoCosto = costoPrevio

  if (tipo === 'entrada') {
    nuevoStock = stockActual + cantidad
    nuevoCosto = stockActual === 0
      ? costo_unitario
      : (stockActual * costoPrevio + cantidad * costo_unitario) / nuevoStock
  } else if (tipo === 'salida') {
    if (cantidad > stockActual) throw new Error(`Stock insuficiente: disponible ${stockActual}`)
    nuevoStock = stockActual - cantidad
  } else {
    nuevoStock = cantidad
  }

  const { error: movErr } = await supabase.from('movimientos_inventario').insert({
    empresa_id, producto_id, bodega_id, tipo, cantidad,
    costo_unitario, stock_resultante: nuevoStock,
    glosa, created_by: user?.id ?? null,
  })
  if (movErr) throw new Error(movErr.message)

  await supabase.from('stock_bodega').upsert({
    empresa_id, producto_id, bodega_id,
    cantidad: nuevoStock, costo_prom: nuevoCosto,
  }, { onConflict: 'producto_id,bodega_id' })
}
