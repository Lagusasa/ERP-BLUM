import { createClient } from '@/lib/supabase/server'
import type { DocumentoGestion } from '@/types/gestion-documental.types'

export interface FiltrosDocumento {
  empresa_id: string
  tipo?: string
  busqueda?: string
  referencia_tabla?: string
  referencia_id?: string
}

export async function getDocumentos(filtros: FiltrosDocumento): Promise<DocumentoGestion[]> {
  const supabase = await createClient()
  let query = supabase
    .from('documentos_gestion')
    .select('*')
    .eq('empresa_id', filtros.empresa_id)
    .eq('estado', 'activo')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros.referencia_tabla) query = query.eq('referencia_tabla', filtros.referencia_tabla)
  if (filtros.referencia_id) query = query.eq('referencia_id', filtros.referencia_id)
  if (filtros.busqueda) query = query.ilike('nombre', `%${filtros.busqueda}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as DocumentoGestion[]
}

export async function createDocumento(
  empresa_id: string,
  input: Omit<DocumentoGestion, 'id' | 'empresa_id' | 'created_at' | 'created_by' | 'estado'>
): Promise<DocumentoGestion> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('documentos_gestion')
    .insert({
      empresa_id,
      ...input,
      estado: 'activo',
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as DocumentoGestion
}

export async function archivarDocumento(id: string, empresa_id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('documentos_gestion')
    .update({ estado: 'archivado' })
    .eq('id', id)
    .eq('empresa_id', empresa_id)

  if (error) throw new Error(error.message)
}

export async function deleteDocumento(id: string, empresa_id: string): Promise<void> {
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documentos_gestion')
    .select('storage_path')
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .maybeSingle()

  if (doc?.storage_path) {
    await supabase.storage.from('documentos').remove([doc.storage_path])
  }

  const { error } = await supabase
    .from('documentos_gestion')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('empresa_id', empresa_id)

  if (error) throw new Error(error.message)
}

export async function getStorageUrl(storage_path: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.storage
    .from('documentos')
    .createSignedUrl(storage_path, 3600)
  return data?.signedUrl ?? null
}
