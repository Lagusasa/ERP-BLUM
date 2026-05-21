import { createClient } from '@/lib/supabase/server'
import type {
  PlanCuenta,
  Comprobante,
  ComprobanteLinia,
  PeriodoContable,
  ComprobanteForm,
} from '@/types/contabilidad.types'
import type {
  BalanceComprobacionLinea,
  EstadoResultados,
  BalanceGeneral,
} from '@/types/reportes.types'

// ============================================================
// PLAN DE CUENTAS
// ============================================================

export async function getCuentas(empresa_id: string): Promise<PlanCuenta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plan_cuentas')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('codigo', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PlanCuenta[]
}

export async function getCuentasImputables(empresa_id: string): Promise<PlanCuenta[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre, clase, saldo_normal')
    .eq('empresa_id', empresa_id)
    .eq('es_imputable', true)
    .eq('es_activo', true)
    .order('codigo', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as PlanCuenta[]
}

export async function createCuenta(
  empresa_id: string,
  data: Partial<PlanCuenta>
): Promise<PlanCuenta> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await supabase
    .from('plan_cuentas')
    .insert({ ...data, empresa_id } as any)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result as unknown as PlanCuenta
}

export async function updateCuenta(
  id: string,
  empresa_id: string,
  data: Partial<PlanCuenta>
): Promise<PlanCuenta> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await supabase
    .from('plan_cuentas')
    .update(data as any)
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return result as unknown as PlanCuenta
}

export async function tieneMigracionTemplate(empresa_id: string): Promise<boolean> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('plan_cuentas')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresa_id)
  return (count ?? 0) > 0
}

// ============================================================
// PERÍODOS CONTABLES
// ============================================================

export async function getPeriodos(empresa_id: string, anio?: number): Promise<PeriodoContable[]> {
  const supabase = await createClient()
  let query = supabase
    .from('periodos_contables')
    .select('*')
    .eq('empresa_id', empresa_id)
    .order('anio', { ascending: false })
    .order('mes', { ascending: true })

  if (anio) query = query.eq('anio', anio)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as PeriodoContable[]
}

export async function getPeriodoActual(empresa_id: string): Promise<PeriodoContable | null> {
  const supabase = await createClient()
  const ahora = new Date()
  const { data } = await supabase
    .from('periodos_contables')
    .select('*')
    .eq('empresa_id', empresa_id)
    .eq('anio', ahora.getFullYear())
    .eq('mes', ahora.getMonth() + 1)
    .eq('estado', 'abierto')
    .maybeSingle()

  return data as PeriodoContable | null
}

// ============================================================
// COMPROBANTES
// ============================================================

export interface FiltrosComprobante {
  empresa_id: string
  anio?: number
  mes?: number
  tipo?: string
  estado?: string
  desde?: string
  hasta?: string
}

export async function getComprobantes(filtros: FiltrosComprobante): Promise<Comprobante[]> {
  const supabase = await createClient()
  let query = supabase
    .from('comprobantes')
    .select(`
      *,
      periodo:periodos_contables(*)
    `)
    .eq('empresa_id', filtros.empresa_id)
    .neq('estado', 'anulado')
    .order('numero', { ascending: false })

  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros.estado) query = query.eq('estado', filtros.estado)
  if (filtros.desde) query = query.gte('fecha', filtros.desde)
  if (filtros.hasta) query = query.lte('fecha', filtros.hasta)
  if (filtros.anio) query = query.eq('periodo.anio', filtros.anio)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Comprobante[]
}

export async function getComprobante(id: string, empresa_id: string): Promise<Comprobante | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('comprobantes')
    .select(`
      *,
      periodo:periodos_contables(*),
      lineas:comprobante_lineas(
        *,
        cuenta:plan_cuentas(id, codigo, nombre, clase, saldo_normal)
      )
    `)
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .maybeSingle()

  return data as unknown as Comprobante | null
}

export async function createComprobante(
  empresa_id: string,
  periodo_id: string,
  formData: ComprobanteForm
): Promise<Comprobante> {
  const supabase = await createClient()

  const totalDebe = formData.lineas.reduce((s, l) => s + l.debe, 0)
  const totalHaber = formData.lineas.reduce((s, l) => s + l.haber, 0)

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    throw new Error(`Comprobante no balanceado: Debe ${totalDebe} ≠ Haber ${totalHaber}`)
  }

  const anio = new Date(formData.fecha).getFullYear()

  const { data: numero, error: numErr } = await supabase
    .rpc('siguiente_numero_comprobante', {
      p_empresa_id: empresa_id,
      p_anio: anio,
    })

  if (numErr) throw new Error(numErr.message)

  const { data: comprobante, error: compErr } = await supabase
    .from('comprobantes')
    .insert({
      empresa_id,
      periodo_id,
      numero,
      tipo: formData.tipo,
      fecha: formData.fecha,
      glosa: formData.glosa,
      total_debe: totalDebe,
      total_haber: totalHaber,
      estado: 'borrador',
    })
    .select()
    .single()

  if (compErr) throw new Error(compErr.message)

  const lineas = formData.lineas.map((l, idx) => ({
    comprobante_id: comprobante.id,
    empresa_id,
    cuenta_id: l.cuenta_id,
    centro_costo_id: l.centro_costo_id || null,
    debe: l.debe,
    haber: l.haber,
    glosa: l.glosa || null,
    orden: idx,
  }))

  const { error: linErr } = await supabase
    .from('comprobante_lineas')
    .insert(lineas)

  if (linErr) throw new Error(linErr.message)

  return comprobante as Comprobante
}

export async function aprobarComprobante(id: string, empresa_id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('comprobantes')
    .update({
      estado: 'aprobado',
      aprobado_by: user?.id,
      aprobado_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .eq('estado', 'borrador')

  if (error) throw new Error(error.message)
}

export async function anularComprobante(id: string, empresa_id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('comprobantes')
    .update({ estado: 'anulado' })
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .in('estado', ['borrador', 'aprobado'])

  if (error) throw new Error(error.message)
}

// ============================================================
// LIBRO MAYOR (por cuenta)
// ============================================================

export async function getMovimientosCuenta(
  empresa_id: string,
  cuenta_id: string,
  desde: string,
  hasta: string
): Promise<ComprobanteLinia[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comprobante_lineas')
    .select(`
      *,
      comprobante:comprobantes(numero, fecha, glosa, tipo, estado)
    `)
    .eq('empresa_id', empresa_id)
    .eq('cuenta_id', cuenta_id)
    .gte('comprobantes.fecha', desde)
    .lte('comprobantes.fecha', hasta)
    .eq('comprobantes.estado', 'aprobado')
    .order('orden', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ComprobanteLinia[]
}

// ============================================================
// RESUMEN CONTABLE (para dashboard)
// ============================================================

export async function getResumenMes(
  empresa_id: string,
  anio: number,
  mes: number
): Promise<{ ventas: number; compras: number; gastos: number }> {
  const supabase = await createClient()

  const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
  const hasta = new Date(anio, mes, 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('comprobantes')
    .select('tipo, total_debe, total_haber')
    .eq('empresa_id', empresa_id)
    .eq('estado', 'aprobado')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .in('tipo', ['ventas', 'compras', 'diario'])

  if (!data) return { ventas: 0, compras: 0, gastos: 0 }

  const ventas = data.filter((c) => c.tipo === 'ventas').reduce((s, c) => s + c.total_haber, 0)
  const compras = data.filter((c) => c.tipo === 'compras').reduce((s, c) => s + c.total_debe, 0)
  const gastos = data.filter((c) => c.tipo === 'diario').reduce((s, c) => s + c.total_debe, 0)

  return { ventas, compras, gastos }
}

// ============================================================
// REPORTES FINANCIEROS
// ============================================================

async function getLineasAprobadas(empresa_id: string, desde?: string, hasta?: string) {
  const supabase = await createClient()

  let q = supabase
    .from('comprobantes')
    .select('id')
    .eq('empresa_id', empresa_id)
    .eq('estado', 'aprobado')

  if (desde) q = q.gte('fecha', desde)
  if (hasta) q = q.lte('fecha', hasta)

  const { data: comprobantes } = await q
  if (!comprobantes?.length) return []

  const ids = comprobantes.map((c) => c.id)

  const { data: lineas } = await supabase
    .from('comprobante_lineas')
    .select('debe, haber, cuenta:plan_cuentas!cuenta_id(id, codigo, nombre, clase, saldo_normal)')
    .in('comprobante_id', ids)

  return lineas ?? []
}

export async function getBalanceComprobacion(
  empresa_id: string,
  desde: string,
  hasta: string
): Promise<BalanceComprobacionLinea[]> {
  const lineas = await getLineasAprobadas(empresa_id, desde, hasta)
  if (!lineas.length) return []

  const map = new Map<string, BalanceComprobacionLinea>()

  for (const l of lineas) {
    const c = l.cuenta as unknown as { id: string; codigo: string; nombre: string; clase: string; saldo_normal: string } | null
    if (!c) continue
    if (!map.has(c.id)) {
      map.set(c.id, { codigo: c.codigo, nombre: c.nombre, clase: c.clase, saldo_normal: c.saldo_normal, total_debe: 0, total_haber: 0, saldo_deudor: 0, saldo_acreedor: 0 })
    }
    const e = map.get(c.id)!
    e.total_debe += l.debe
    e.total_haber += l.haber
  }

  for (const e of map.values()) {
    const saldo = e.total_debe - e.total_haber
    e.saldo_deudor = saldo > 0 ? saldo : 0
    e.saldo_acreedor = saldo < 0 ? -saldo : 0
  }

  return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))
}

export async function getEstadoResultados(
  empresa_id: string,
  desde: string,
  hasta: string
): Promise<EstadoResultados> {
  const lineas = await getLineasAprobadas(empresa_id, desde, hasta)
  const RESULT_CLASES = new Set(['ingreso', 'costo', 'gasto'])

  const map = new Map<string, { codigo: string; nombre: string; clase: string; saldo_normal: string; debe: number; haber: number }>()

  for (const l of lineas) {
    const c = l.cuenta as unknown as { id: string; codigo: string; nombre: string; clase: string; saldo_normal: string } | null
    if (!c || !RESULT_CLASES.has(c.clase)) continue
    if (!map.has(c.id)) {
      map.set(c.id, { codigo: c.codigo, nombre: c.nombre, clase: c.clase, saldo_normal: c.saldo_normal, debe: 0, haber: 0 })
    }
    const e = map.get(c.id)!
    e.debe += l.debe
    e.haber += l.haber
  }

  const ingresos: EstadoResultados['ingresos'] = []
  const costos: EstadoResultados['costos'] = []
  const gastos: EstadoResultados['gastos'] = []

  for (const e of Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))) {
    const monto = e.saldo_normal === 'acreedor' ? e.haber - e.debe : e.debe - e.haber
    const item = { codigo: e.codigo, nombre: e.nombre, monto }
    if (e.clase === 'ingreso') ingresos.push(item)
    else if (e.clase === 'costo') costos.push(item)
    else gastos.push(item)
  }

  const total_ingresos = ingresos.reduce((s, i) => s + i.monto, 0)
  const total_costos = costos.reduce((s, i) => s + i.monto, 0)
  const total_gastos = gastos.reduce((s, i) => s + i.monto, 0)

  return {
    ingresos, costos, gastos,
    total_ingresos, total_costos, total_gastos,
    resultado_bruto: total_ingresos - total_costos,
    resultado_neto: total_ingresos - total_costos - total_gastos,
  }
}

export async function getBalanceGeneral(
  empresa_id: string,
  hasta: string
): Promise<BalanceGeneral> {
  const lineas = await getLineasAprobadas(empresa_id, undefined, hasta)
  const BALANCE_CLASES = new Set(['activo', 'pasivo', 'patrimonio'])

  const map = new Map<string, { codigo: string; nombre: string; clase: string; saldo_normal: string; debe: number; haber: number }>()

  for (const l of lineas) {
    const c = l.cuenta as unknown as { id: string; codigo: string; nombre: string; clase: string; saldo_normal: string } | null
    if (!c || !BALANCE_CLASES.has(c.clase)) continue
    if (!map.has(c.id)) {
      map.set(c.id, { codigo: c.codigo, nombre: c.nombre, clase: c.clase, saldo_normal: c.saldo_normal, debe: 0, haber: 0 })
    }
    const e = map.get(c.id)!
    e.debe += l.debe
    e.haber += l.haber
  }

  const activos: BalanceGeneral['activos'] = []
  const pasivos: BalanceGeneral['pasivos'] = []
  const patrimonio: BalanceGeneral['patrimonio'] = []

  for (const e of Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))) {
    const saldo = e.saldo_normal === 'deudor' ? e.debe - e.haber : e.haber - e.debe
    if (saldo === 0) continue
    const item = { codigo: e.codigo, nombre: e.nombre, saldo }
    if (e.clase === 'activo') activos.push(item)
    else if (e.clase === 'pasivo') pasivos.push(item)
    else patrimonio.push(item)
  }

  const total_activo = activos.reduce((s, i) => s + i.saldo, 0)
  const total_pasivo = pasivos.reduce((s, i) => s + i.saldo, 0)
  const total_patrimonio = patrimonio.reduce((s, i) => s + i.saldo, 0)

  return {
    activos, pasivos, patrimonio,
    total_activo, total_pasivo, total_patrimonio,
    diferencia: total_activo - (total_pasivo + total_patrimonio),
  }
}
