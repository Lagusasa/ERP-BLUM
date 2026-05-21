import { createClient } from '@/lib/supabase/server'
import type { Proveedor, DocumentoCompra, TipoDocumento } from '@/types/compras.types'

// ============================================================
// PROVEEDORES
// ============================================================

export async function getProveedores(empresa_id: string): Promise<Proveedor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('empresa_id', empresa_id)
    .is('deleted_at', null)
    .order('razon_social', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Proveedor[]
}

export async function getProveedor(id: string, empresa_id: string): Promise<Proveedor | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proveedores')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .is('deleted_at', null)
    .maybeSingle()

  return data as Proveedor | null
}

export async function createProveedor(
  empresa_id: string,
  data: Omit<Proveedor, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>
): Promise<Proveedor> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('proveedores')
    .insert({ ...data, empresa_id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result as Proveedor
}

export async function updateProveedor(
  id: string,
  empresa_id: string,
  data: Partial<Proveedor>
): Promise<Proveedor> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await supabase
    .from('proveedores')
    .update(data as any)
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result as Proveedor
}

// ============================================================
// DOCUMENTOS DE COMPRA
// ============================================================

export interface FiltrosDocumentoCompra {
  empresa_id: string
  desde?: string
  hasta?: string
  estado?: string
  proveedor_id?: string
}

export async function getDocumentosCompra(filtros: FiltrosDocumentoCompra): Promise<DocumentoCompra[]> {
  const supabase = await createClient()
  let query = supabase
    .from('documentos_compra')
    .select(`
      *,
      proveedor:proveedores(id, rut, razon_social),
      tipo_documento:tipos_documento(id, codigo, nombre, abreviatura)
    `)
    .eq('empresa_id', filtros.empresa_id)
    .is('deleted_at', null)
    .order('fecha_emision', { ascending: false })

  if (filtros.estado) query = query.eq('estado', filtros.estado)
  if (filtros.proveedor_id) query = query.eq('proveedor_id', filtros.proveedor_id)
  if (filtros.desde) query = query.gte('fecha_emision', filtros.desde)
  if (filtros.hasta) query = query.lte('fecha_emision', filtros.hasta)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as DocumentoCompra[]
}

export async function createDocumentoCompra(
  empresa_id: string,
  data: Omit<DocumentoCompra, 'id' | 'empresa_id' | 'created_at' | 'updated_at' | 'iva' | 'total' | 'proveedor' | 'tipo_documento'>
): Promise<DocumentoCompra> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('documentos_compra')
    .insert({ ...data, empresa_id })
    .select(`
      *,
      proveedor:proveedores(id, rut, razon_social),
      tipo_documento:tipos_documento(id, codigo, nombre, abreviatura)
    `)
    .single()

  if (error) throw new Error(error.message)
  return result as unknown as DocumentoCompra
}

// ============================================================
// TIPOS DE DOCUMENTO
// ============================================================

export async function getTiposDocumento(): Promise<TipoDocumento[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tipos_documento')
    .select('*')
    .eq('is_active', true)
    .order('codigo', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as TipoDocumento[]
}

// ============================================================
// RESUMEN IVA (libro de compras)
// ============================================================

export async function getResumenIVACompras(
  empresa_id: string,
  anio: number,
  mes: number
): Promise<{ total_neto: number; total_iva: number; total: number; cantidad: number }> {
  const supabase = await createClient()
  const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
  const hasta = new Date(anio, mes, 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('documentos_compra')
    .select('neto, iva, total')
    .eq('empresa_id', empresa_id)
    .neq('estado', 'anulado')
    .gte('fecha_emision', desde)
    .lte('fecha_emision', hasta)
    .is('deleted_at', null)

  if (!data) return { total_neto: 0, total_iva: 0, total: 0, cantidad: 0 }

  return {
    total_neto: data.reduce((s, d) => s + d.neto, 0),
    total_iva: data.reduce((s, d) => s + d.iva, 0),
    total: data.reduce((s, d) => s + d.total, 0),
    cantidad: data.length,
  }
}
