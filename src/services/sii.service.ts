import { createClient } from '@/lib/supabase/server'
import type { DteDocumento, BoletaHonorarios, F22Declaracion, SiiConfig, F22Lineas } from '@/types/sii.types'

export async function getDteDocumentos(empresa_id: string, tipo_dte?: string): Promise<DteDocumento[]> {
  const supabase = await createClient()
  let query = supabase
    .from('dte_documentos')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('fecha_emision', { ascending: false })
    .order('folio', { ascending: false })
    .limit(200)

  if (tipo_dte) query = query.eq('tipo_dte', tipo_dte)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as DteDocumento[]
}

export async function crearDte(
  empresa_id: string,
  input: Omit<DteDocumento, 'id' | 'empresa_id' | 'created_at'>
): Promise<DteDocumento> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dte_documentos')
    .insert({ ...input, empresa_id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as DteDocumento
}

export async function actualizarEstadoDte(id: string, estado: DteDocumento['estado'], track_id?: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('dte_documentos')
    .update({ estado, ...(track_id ? { track_id } : {}) })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getBoletasHonorarios(empresa_id: string, tipo?: 'emitida' | 'recibida'): Promise<BoletaHonorarios[]> {
  const supabase = await createClient()
  let query = supabase
    .from('boletas_honorarios')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('fecha', { ascending: false })
    .limit(200)

  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as BoletaHonorarios[]
}

export async function crearBoletaHonorarios(
  empresa_id: string,
  input: Omit<BoletaHonorarios, 'id' | 'empresa_id' | 'retencion_10' | 'monto_liquido' | 'created_at'>
): Promise<BoletaHonorarios> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('boletas_honorarios')
    .insert({ ...input, empresa_id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as BoletaHonorarios
}

export async function getF22(empresa_id: string, anio: number): Promise<F22Declaracion | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('f22_declaraciones')
    .select('*')
    .eq('empresa_id', empresa_id)
    .eq('anio_tributario', anio)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as F22Declaracion | null
}

export async function upsertF22(empresa_id: string, anio: number, datos_json: Record<string, number>): Promise<F22Declaracion> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('f22_declaraciones')
    .upsert({ empresa_id, anio_tributario: anio, datos_json, estado: 'borrador' },
      { onConflict: 'empresa_id,anio_tributario' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as F22Declaracion
}

export async function getSiiConfig(empresa_id: string): Promise<SiiConfig | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sii_config')
    .select('*')
    .eq('empresa_id', empresa_id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as SiiConfig | null
}

export async function upsertSiiConfig(empresa_id: string, input: Omit<SiiConfig, 'id' | 'empresa_id' | 'created_at'>): Promise<SiiConfig> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sii_config')
    .upsert({ ...input, empresa_id }, { onConflict: 'empresa_id' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as SiiConfig
}

export async function calcularF22(empresa_id: string, anio: number): Promise<F22Lineas> {
  const supabase = await createClient()
  const anio_str = String(anio)
  const desde = `${anio_str}-01-01`
  const hasta = `${anio_str}-12-31`

  // Movimientos de caja del año para PPM y retenciones
  const { data: movs } = await supabase
    .from('movimientos_caja')
    .select('tipo, categoria, monto')
    .eq('empresa_id', empresa_id)
    .gte('fecha', desde)
    .lte('fecha', hasta)

  // Boletas de honorarios recibidas (retenciones pagadas)
  const { data: boletas } = await supabase
    .from('boletas_honorarios')
    .select('retencion_10, estado')
    .eq('empresa_id', empresa_id)
    .eq('tipo', 'recibida')
    .eq('estado', 'vigente')
    .gte('fecha', desde)
    .lte('fecha', hasta)

  // Ajustes RLI del año
  const { data: ajustes } = await supabase
    .from('rli_ajustes')
    .select('tipo, monto')
    .eq('empresa_id', empresa_id)
    .eq('anio', anio)

  const ppme = (movs ?? [])
    .filter((m) => m.tipo === 'egreso' && m.categoria === 'impuestos')
    .reduce((s, m) => s + m.monto, 0)

  const retenciones = (boletas ?? []).reduce((s, b) => s + (b.retencion_10 ?? 0), 0)

  const agregados = (ajustes ?? []).filter((a) => a.tipo === 'agrega').reduce((s, a) => s + a.monto, 0)
  const deducidos = (ajustes ?? []).filter((a) => a.tipo === 'deduce').reduce((s, a) => s + a.monto, 0)

  // Calcular resultado contable desde movimientos caja del año
  const ingresos = (movs ?? []).filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos = (movs ?? []).filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const resultado_contable = ingresos - egresos

  const rli = resultado_contable + agregados - deducidos
  const tasa = 0.27
  const impuesto_determinado = rli > 0 ? rli * tasa : 0
  const impuesto_pagar = Math.max(0, impuesto_determinado - ppme - retenciones)
  const impuesto_devolver = Math.max(0, ppme + retenciones - impuesto_determinado)

  return {
    resultado_contable, agregados, deducidos, rli, tasa,
    impuesto_determinado, ppme, retenciones, impuesto_pagar, impuesto_devolver,
  }
}
