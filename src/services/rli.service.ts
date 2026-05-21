import { createClient } from '@/lib/supabase/server'
import type { RliAjuste, RliResumen } from '@/types/reportes.types'
import { getEstadoResultados } from './contabilidad.service'

export async function getRliAjustes(empresa_id: string, anio: number): Promise<RliAjuste[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rli_ajustes')
    .select('*')
    .eq('empresa_id', empresa_id)
    .eq('anio', anio)
    .order('tipo')
    .order('created_at')

  if (error) throw new Error(error.message)
  return (data ?? []) as RliAjuste[]
}

export async function getRli(
  empresa_id: string,
  anio: number,
  tasa: number = 0.27
): Promise<RliResumen> {
  const desde = `${anio}-01-01`
  const hasta = `${anio}-12-31`

  const [estado, ajustes] = await Promise.all([
    getEstadoResultados(empresa_id, desde, hasta),
    getRliAjustes(empresa_id, anio),
  ])

  const resultado_contable = estado.resultado_neto
  const total_agrega = ajustes.filter((a) => a.tipo === 'agrega').reduce((s, a) => s + a.monto, 0)
  const total_deduce = ajustes.filter((a) => a.tipo === 'deduce').reduce((s, a) => s + a.monto, 0)
  const rli = resultado_contable + total_agrega - total_deduce
  const impuesto = rli > 0 ? rli * tasa : 0

  return { resultado_contable, total_agrega, total_deduce, rli, tasa, impuesto, ajustes }
}

export async function createRliAjuste(
  empresa_id: string,
  anio: number,
  tipo: 'agrega' | 'deduce',
  concepto: string,
  monto: number
): Promise<RliAjuste> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('rli_ajustes')
    .insert({ empresa_id, anio, tipo, concepto, monto, created_by: user?.id ?? null })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as RliAjuste
}

export async function deleteRliAjuste(id: string, empresa_id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('rli_ajustes')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresa_id)

  if (error) throw new Error(error.message)
}
