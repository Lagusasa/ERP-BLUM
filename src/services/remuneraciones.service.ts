import { createClient } from '@/lib/supabase/server'
import type { Trabajador, Contrato, Liquidacion, AFP, Isapre, Mutualidad } from '@/types/remuneraciones.types'
export type { IndicadoresPrevisionales } from '@/types/indicadores.types'
export { INDICADORES_DEFAULT } from '@/types/indicadores.types'

export async function getTrabajadores(empresa_id: string): Promise<Trabajador[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajadores')
    .select(`
      *,
      afp:afp(id, nombre, tasa),
      isapre:isapres(id, nombre),
      contrato_activo:contratos(
        id, tipo_contrato, cargo, departamento, fecha_inicio, fecha_termino,
        sueldo_base, jornada_horas, gratificacion_tipo, es_activo
      )
    `)
    .eq('empresa_id', empresa_id)
    .eq('is_active', true)
    .order('apellido_paterno', { ascending: true })

  if (error || !data) return []
  return data.map((t) => ({
    ...t,
    contrato_activo: Array.isArray(t.contrato_activo)
      ? t.contrato_activo.find((c: Contrato) => c.es_activo) ?? null
      : null,
  })) as unknown as Trabajador[]
}

export async function getTrabajador(id: string): Promise<Trabajador | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajadores')
    .select(`
      *,
      afp:afp(id, nombre, tasa),
      isapre:isapres(id, nombre)
    `)
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data as unknown as Trabajador
}

export interface CreateTrabajadorInput {
  rut: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  fecha_nacimiento?: string
  genero?: string
  email?: string
  telefono?: string
  direccion?: string
  comuna?: string
  ciudad?: string
  afp_id?: string
  isapre_id?: string
  tipo_afiliacion?: 'afp' | 'ips' | 'ninguno'
}

export async function createTrabajador(
  empresa_id: string,
  input: CreateTrabajadorInput
): Promise<{ id: string } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trabajadores')
    .insert({ empresa_id, ...input, tipo_afiliacion: input.tipo_afiliacion ?? 'ninguno', is_active: true })
    .select('id')
    .single()
  if (error || !data) return null
  return { id: data.id }
}

export interface CreateContratoInput {
  tipo_contrato: string
  cargo?: string
  departamento?: string
  fecha_inicio: string
  fecha_termino?: string
  sueldo_base: number
  jornada_horas?: number
  gratificacion_tipo?: string
}

export async function createContrato(
  empresa_id: string,
  trabajador_id: string,
  input: CreateContratoInput
): Promise<{ id: string } | null> {
  const supabase = await createClient()
  await supabase
    .from('contratos')
    .update({ es_activo: false })
    .eq('trabajador_id', trabajador_id)
    .eq('es_activo', true)

  const { data, error } = await supabase
    .from('contratos')
    .insert({ empresa_id, trabajador_id, jornada_horas: 45, gratificacion_tipo: 'legal', ...input, es_activo: true })
    .select('id')
    .single()
  if (error || !data) return null
  return { id: data.id }
}

export async function getLiquidaciones(
  empresa_id: string,
  mes?: number,
  anio?: number
): Promise<Liquidacion[]> {
  const supabase = await createClient()
  let query = supabase
    .from('liquidaciones')
    .select(`
      *,
      trabajador:trabajadores(nombre, apellido_paterno, rut)
    `)
    .eq('empresa_id', empresa_id)
    .order('periodo_anio', { ascending: false })
    .order('periodo_mes', { ascending: false })

  if (mes && anio) {
    query = query.eq('periodo_mes', mes).eq('periodo_anio', anio)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data as unknown as Liquidacion[]
}

export async function createLiquidacion(
  empresa_id: string,
  input: Omit<Liquidacion, 'id' | 'created_at' | 'trabajador'>
): Promise<{ id: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('liquidaciones')
    .insert({ ...input, empresa_id, created_by: user?.id })
    .select('id')
    .single()
  if (error || !data) return null
  return { id: data.id }
}

export async function aprobarLiquidacion(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('liquidaciones')
    .update({ estado: 'aprobada' })
    .eq('id', id)
  return !error
}

export async function getAFPs(): Promise<AFP[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('afp').select('*').eq('is_active', true).order('nombre')
  return (data ?? []) as AFP[]
}

export async function getIsapres(): Promise<Isapre[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('isapres').select('*').eq('is_active', true).order('nombre')
  return (data ?? []) as Isapre[]
}

export async function getMutualidades(): Promise<Mutualidad[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('mutualidades').select('*').eq('is_active', true).order('nombre')
  return (data ?? []) as Mutualidad[]
}

export async function getResumenRemuneraciones(
  empresa_id: string,
  mes: number,
  anio: number
): Promise<{
  total_trabajadores: number
  total_bruto: number
  total_descuentos: number
  total_liquido: number
  liquidaciones_aprobadas: number
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('liquidaciones')
    .select('total_imponible, total_no_imponible, total_descuentos, sueldo_liquido, estado')
    .eq('empresa_id', empresa_id)
    .eq('periodo_mes', mes)
    .eq('periodo_anio', anio)
    .neq('estado', 'anulada')

  if (!data) return { total_trabajadores: 0, total_bruto: 0, total_descuentos: 0, total_liquido: 0, liquidaciones_aprobadas: 0 }

  return {
    total_trabajadores: data.length,
    total_bruto: data.reduce((s, l) => s + (l.total_imponible ?? 0) + (l.total_no_imponible ?? 0), 0),
    total_descuentos: data.reduce((s, l) => s + (l.total_descuentos ?? 0), 0),
    total_liquido: data.reduce((s, l) => s + (l.sueldo_liquido ?? 0), 0),
    liquidaciones_aprobadas: data.filter((l) => l.estado === 'aprobada' || l.estado === 'pagada').length,
  }
}

// ── LIBRO DE REMUNERACIONES ──────────────────────────────────
export async function getLibroRemuneraciones(
  empresa_id: string,
  mes: number,
  anio: number
): Promise<Liquidacion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('liquidaciones')
    .select(`
      *,
      trabajador:trabajadores(nombre, apellido_paterno, apellido_materno, rut)
    `)
    .eq('empresa_id', empresa_id)
    .eq('periodo_mes', mes)
    .eq('periodo_anio', anio)
    .in('estado', ['aprobada', 'pagada'])
    .order('trabajador_id', { ascending: true })
  return (data ?? []) as unknown as Liquidacion[]
}

// ── LIBRO DE HONORARIOS ──────────────────────────────────────
export interface PagoHonorarios {
  id: string
  empresa_id: string
  trabajador_id: string | null
  rut_prestador: string
  nombre_prestador: string
  fecha: string
  concepto: string
  n_boleta: string | null
  monto_bruto: number
  retencion_pct: number
  retencion_monto: number
  monto_neto: number
  estado: 'pendiente' | 'pagado' | 'anulado'
  referencia: string | null
  created_at: string
}

export async function getPagosHonorarios(
  empresa_id: string,
  anio?: number,
  mes?: number
): Promise<PagoHonorarios[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any)
    .from('pagos_honorarios')
    .select('*')
    .eq('empresa_id', empresa_id)
    .neq('estado', 'anulado')
    .order('fecha', { ascending: false }) as { data: PagoHonorarios[] | null; error: { message: string } | null }

  if (anio) q = (q as unknown as ReturnType<typeof supabase.from>).gte('fecha', `${anio}-01-01`).lte('fecha', `${anio}-12-31`) as unknown as typeof q
  if (mes && anio) q = (q as unknown as ReturnType<typeof supabase.from>).gte('fecha', `${anio}-${String(mes).padStart(2,'0')}-01`).lte('fecha', `${anio}-${String(mes).padStart(2,'0')}-31`) as unknown as typeof q

  const { data } = await q
  return data ?? []
}

export type CreatePagoHonorariosInput = Omit<PagoHonorarios, 'id' | 'retencion_monto' | 'monto_neto' | 'created_at'>

export async function createPagoHonorarios(
  input: CreatePagoHonorariosInput
): Promise<{ id: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('pagos_honorarios')
    .insert({ ...input, created_by: user?.id })
    .select('id')
    .single() as { data: { id: string } | null; error: { message: string } | null }
  if (error || !data) return null
  return { id: data.id }
}

export async function updateEstadoHonorario(id: string, estado: 'pagado' | 'anulado'): Promise<boolean> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('pagos_honorarios').update({ estado }).eq('id', id)
  return !error
}

// ── INDICADORES PREVISIONALES ────────────────────────────────
import type { IndicadoresPrevisionales } from '@/types/indicadores.types'
import { INDICADORES_DEFAULT } from '@/types/indicadores.types'

export async function getIndicadores(
  empresa_id: string,
  anio: number
): Promise<IndicadoresPrevisionales> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('indicadores_previsionales')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('anio', anio)
      .maybeSingle() as { data: Partial<IndicadoresPrevisionales> | null }
    // Always merge with defaults so no field is ever undefined
    return { empresa_id, anio, ...INDICADORES_DEFAULT, ...(data ?? {}) }
  } catch {
    return { empresa_id, anio, ...INDICADORES_DEFAULT }
  }
}

export async function upsertIndicadores(ind: IndicadoresPrevisionales): Promise<boolean> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('indicadores_previsionales')
    .upsert({ ...ind }, { onConflict: 'empresa_id,anio' })
  return !error
}

export async function updateAfpTasa(id: string, tasa: number): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase.from('afp').update({ tasa } as never).eq('id', id)
  return !error
}
