import { createClient } from '@/lib/supabase/server'
import type { Cliente, DocumentoVenta } from '@/types/compras.types'

// ============================================================
// CLIENTES
// ============================================================

export async function getClientes(empresa_id: string): Promise<Cliente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', empresa_id)
    .is('deleted_at', null)
    .order('razon_social', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Cliente[]
}

export async function getCliente(id: string, empresa_id: string): Promise<Cliente | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .is('deleted_at', null)
    .maybeSingle()

  return data as Cliente | null
}

export async function createCliente(
  empresa_id: string,
  data: Omit<Cliente, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>
): Promise<Cliente> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('clientes')
    .insert({ ...data, empresa_id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result as Cliente
}

export async function updateCliente(
  id: string,
  empresa_id: string,
  data: Partial<Cliente>
): Promise<Cliente> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await supabase
    .from('clientes')
    .update(data as any)
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result as Cliente
}

// ============================================================
// DOCUMENTOS DE VENTA
// ============================================================

export interface FiltrosDocumentoVenta {
  empresa_id: string
  desde?: string
  hasta?: string
  estado?: string
  cliente_id?: string
}

export async function getDocumentosVenta(filtros: FiltrosDocumentoVenta): Promise<DocumentoVenta[]> {
  const supabase = await createClient()
  let query = supabase
    .from('documentos_venta')
    .select(`
      *,
      cliente:clientes(id, rut, razon_social),
      tipo_documento:tipos_documento(id, codigo, nombre, abreviatura)
    `)
    .eq('empresa_id', filtros.empresa_id)
    .is('deleted_at', null)
    .order('fecha_emision', { ascending: false })

  if (filtros.estado) query = query.eq('estado', filtros.estado)
  if (filtros.cliente_id) query = query.eq('cliente_id', filtros.cliente_id)
  if (filtros.desde) query = query.gte('fecha_emision', filtros.desde)
  if (filtros.hasta) query = query.lte('fecha_emision', filtros.hasta)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as DocumentoVenta[]
}

export async function createDocumentoVenta(
  empresa_id: string,
  data: Omit<DocumentoVenta, 'id' | 'empresa_id' | 'created_at' | 'updated_at' | 'iva' | 'total' | 'cliente' | 'tipo_documento'>
): Promise<DocumentoVenta> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('documentos_venta')
    .insert({ ...data, empresa_id })
    .select(`
      *,
      cliente:clientes(id, rut, razon_social),
      tipo_documento:tipos_documento(id, codigo, nombre, abreviatura)
    `)
    .single()

  if (error) throw new Error(error.message)
  return result as unknown as DocumentoVenta
}

// ============================================================
// RESUMEN IVA (libro de ventas)
// ============================================================

export async function getResumenIVAVentas(
  empresa_id: string,
  anio: number,
  mes: number
): Promise<{ total_neto: number; total_iva: number; total: number; cantidad: number }> {
  const supabase = await createClient()
  const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
  const hasta = new Date(anio, mes, 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('documentos_venta')
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
