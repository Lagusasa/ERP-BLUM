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
    .eq('is_active', true)
    .order('codigo', { ascending: true })

  if (error) { console.error('[getCuentasImputables]', error.message); return [] }
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
      map.set(c.id, {
        codigo: c.codigo, nombre: c.nombre, clase: c.clase, saldo_normal: c.saldo_normal,
        total_debe: 0, total_haber: 0,
        saldo_deudor: 0, saldo_acreedor: 0,
        balance_debe: 0, balance_haber: 0,
        resultado_debe: 0, resultado_haber: 0,
      })
    }
    const e = map.get(c.id)!
    e.total_debe += l.debe
    e.total_haber += l.haber
  }

  for (const e of map.values()) {
    const saldo = e.total_debe - e.total_haber
    e.saldo_deudor   = saldo > 0 ? saldo : 0
    e.saldo_acreedor = saldo < 0 ? -saldo : 0

    if (e.clase === 'activo') {
      e.balance_debe  = e.saldo_deudor
    } else if (e.clase === 'pasivo' || e.clase === 'patrimonio') {
      e.balance_haber = e.saldo_acreedor
    } else if (e.clase === 'gasto' || e.clase === 'costo') {
      e.resultado_debe = e.saldo_deudor
    } else if (e.clase === 'ingreso') {
      e.resultado_haber = e.saldo_acreedor
    }
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

import type {
  FlujoCajaResumen,
  FlujoCajaItem,
  RazonesFinancierasData,
  AntiguedadSaldosData,
  AntiguedadLinea,
  AntiguedadBucket,
  PresupuestoLinea,
} from '@/types/reportes.types'
import type { ActivoFijo } from '@/types/activos_fijos.types'
import { CATEGORIA_LABELS } from '@/types/finanzas.types'

const CAT_OPERACION    = new Set(['cobranza_clientes','pago_proveedores','remuneraciones','impuestos','servicios','arriendo','gastos_financieros','otros_ingresos','otros_egresos'])
const CAT_INVERSION    = new Set(['inversion'])
const CAT_FINANCIAMIENTO = new Set(['prestamo','aporte_capital'])

export async function getFlujoCaja(
  empresa_id: string,
  desde: string,
  hasta: string
): Promise<FlujoCajaResumen> {
  const supabase = await createClient()

  const { data: movs } = await supabase
    .from('movimientos_caja')
    .select('tipo, categoria, monto')
    .eq('empresa_id', empresa_id)
    .gte('fecha', desde)
    .lte('fecha', hasta)

  const { data: cuentas } = await supabase
    .from('cuentas_bancarias')
    .select('saldo_inicial, saldo_actual')
    .eq('empresa_id', empresa_id)
    .eq('is_active', true)

  const rows = movs ?? []

  const totales = new Map<string, number>()
  for (const m of rows) {
    const key = `${m.tipo}|${m.categoria}`
    totales.set(key, (totales.get(key) ?? 0) + m.monto)
  }

  function buildItems(cats: Set<string>): FlujoCajaItem[] {
    const items: FlujoCajaItem[] = []
    for (const [key, total] of totales.entries()) {
      const [tipo, cat] = key.split('|') as ['ingreso' | 'egreso', string]
      if (cats.has(cat)) {
        items.push({ categoria: CATEGORIA_LABELS[cat] ?? cat, tipo, total })
      }
    }
    return items.sort((a, b) => a.categoria.localeCompare(b.categoria))
  }

  function neto(items: FlujoCajaItem[]) {
    return items.reduce((s, i) => s + (i.tipo === 'ingreso' ? i.total : -i.total), 0)
  }

  const opItems = buildItems(CAT_OPERACION)
  const invItems = buildItems(CAT_INVERSION)
  const finItems = buildItems(CAT_FINANCIAMIENTO)
  const opNeto  = neto(opItems)
  const invNeto = neto(invItems)
  const finNeto = neto(finItems)

  const saldo_inicial = (cuentas ?? []).reduce((s, c) => s + c.saldo_inicial, 0)
  const saldo_final   = (cuentas ?? []).reduce((s, c) => s + c.saldo_actual,  0)

  return {
    operacion:      { items: opItems,  neto: opNeto  },
    inversion:      { items: invItems, neto: invNeto },
    financiamiento: { items: finItems, neto: finNeto },
    variacion_neta: opNeto + invNeto + finNeto,
    saldo_inicial,
    saldo_final,
  }
}

export interface LibroMayorCuenta {
  cuenta_id: string
  codigo: string
  nombre: string
  clase: string
  saldo_normal: string
  saldo_anterior: number
  movimientos: Array<{
    fecha: string
    numero: number
    glosa: string
    debe: number
    haber: number
    saldo: number
  }>
  total_debe: number
  total_haber: number
  saldo_final: number
}

export async function getLibroMayor(
  empresa_id: string,
  desde: string,
  hasta: string,
  cuenta_id?: string
): Promise<LibroMayorCuenta[]> {
  const supabase = await createClient()

  // 1. Comprobantes aprobados en el período (filtramos directamente en su tabla)
  const { data: comps, error: errComps } = await supabase
    .from('comprobantes')
    .select('id, numero, fecha, glosa')
    .eq('empresa_id', empresa_id)
    .eq('estado', 'aprobado')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })
    .order('numero', { ascending: true })

  if (errComps) { console.error('[getLibroMayor] comps', errComps.message); return [] }
  if (!comps?.length) return []

  const compIds = comps.map((c) => c.id)
  const compMap = new Map(comps.map((c) => [c.id, c]))

  // 2. Líneas de esos comprobantes
  let linQuery = supabase
    .from('comprobante_lineas')
    .select('comprobante_id, debe, haber, glosa, cuenta:plan_cuentas(id, codigo, nombre, clase, saldo_normal)')
    .in('comprobante_id', compIds)

  if (cuenta_id) linQuery = linQuery.eq('cuenta_id', cuenta_id)

  const { data: lineas, error: errLin } = await linQuery
  if (errLin) { console.error('[getLibroMayor] lineas', errLin.message); return [] }

  // 3. Saldos anteriores al período
  const { data: compsAnt } = await supabase
    .from('comprobantes')
    .select('id')
    .eq('empresa_id', empresa_id)
    .eq('estado', 'aprobado')
    .lt('fecha', desde)

  const prevIds = (compsAnt ?? []).map((c) => c.id)
  let prevData: { debe: number; haber: number; cuenta: unknown }[] = []
  if (prevIds.length) {
    let prevQ = supabase
      .from('comprobante_lineas')
      .select('debe, haber, cuenta:plan_cuentas(id, saldo_normal)')
      .in('comprobante_id', prevIds)
    if (cuenta_id) prevQ = prevQ.eq('cuenta_id', cuenta_id)
    const { data: pRows } = await prevQ
    prevData = (pRows ?? []) as typeof prevData
  }

  // Acumular saldos anteriores por cuenta
  const saldosAnt = new Map<string, number>()
  for (const l of prevData) {
    const c = l.cuenta as unknown as { id: string; saldo_normal: string } | null
    if (!c) continue
    const prev = saldosAnt.get(c.id) ?? 0
    const delta = c.saldo_normal === 'deudor' ? l.debe - l.haber : l.haber - l.debe
    saldosAnt.set(c.id, prev + delta)
  }

  // Agrupar movimientos por cuenta
  const map = new Map<string, LibroMayorCuenta>()

  for (const l of lineas ?? []) {
    const c = l.cuenta as unknown as { id: string; codigo: string; nombre: string; clase: string; saldo_normal: string } | null
    const comp = compMap.get((l as unknown as { comprobante_id: string }).comprobante_id) ?? null
    if (!c || !comp) continue

    if (!map.has(c.id)) {
      map.set(c.id, {
        cuenta_id: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        clase: c.clase,
        saldo_normal: c.saldo_normal,
        saldo_anterior: saldosAnt.get(c.id) ?? 0,
        movimientos: [],
        total_debe: 0,
        total_haber: 0,
        saldo_final: 0,
      })
    }

    const entry = map.get(c.id)!
    const saldoAcum = entry.saldo_anterior + entry.movimientos.reduce((s, m) => {
      return s + (c.saldo_normal === 'deudor' ? m.debe - m.haber : m.haber - m.debe)
    }, 0)
    const delta = c.saldo_normal === 'deudor' ? l.debe - l.haber : l.haber - l.debe

    const lineaGlosa = (l as unknown as { glosa: string | null }).glosa
    entry.movimientos.push({
      fecha: comp.fecha,
      numero: comp.numero,
      glosa: lineaGlosa || comp.glosa || '',
      debe: l.debe,
      haber: l.haber,
      saldo: saldoAcum + delta,
    })
    entry.total_debe += l.debe
    entry.total_haber += l.haber
  }

  // Calcular saldo final
  for (const entry of map.values()) {
    const delta = entry.saldo_normal === 'deudor'
      ? entry.total_debe - entry.total_haber
      : entry.total_haber - entry.total_debe
    entry.saldo_final = entry.saldo_anterior + delta
  }

  return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))
}

// ============================================================
// ACTIVOS FIJOS
// ============================================================

export async function getActivosFijos(empresa_id: string): Promise<ActivoFijo[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activos, error } = await (supabase as any)
    .from('activos_fijos')
    .select('*')
    .eq('empresa_id', empresa_id)
    .eq('is_active', true)
    .order('codigo') as { data: ActivoFijo[] | null; error: { message: string } | null }

  if (error) { console.error('[getActivosFijos]', error.message); return [] }
  if (!activos?.length) return []

  const ids = activos.map((a) => a.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deps } = await (supabase as any)
    .from('depreciaciones')
    .select('activo_id, monto')
    .in('activo_id', ids) as { data: { activo_id: string; monto: number }[] | null }

  const depMap = new Map<string, { total: number; meses: number }>()
  for (const d of deps ?? []) {
    const curr = depMap.get(d.activo_id) ?? { total: 0, meses: 0 }
    depMap.set(d.activo_id, { total: curr.total + d.monto, meses: curr.meses + 1 })
  }

  return activos.map((a) => ({
    ...a,
    depreciacion_acumulada: depMap.get(a.id)?.total ?? 0,
    meses_depreciados: depMap.get(a.id)?.meses ?? 0,
  })) as ActivoFijo[]
}

export async function createActivoFijo(empresa_id: string, data: Omit<ActivoFijo, 'id' | 'empresa_id' | 'created_at'>): Promise<ActivoFijo> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase as any)
    .from('activos_fijos')
    .insert({ ...data, empresa_id })
    .select()
    .single() as { data: ActivoFijo | null; error: { message: string } | null }

  if (error) throw new Error(error.message)
  return result as ActivoFijo
}

export async function updateActivoFijo(id: string, empresa_id: string, data: Partial<ActivoFijo>): Promise<ActivoFijo> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase as any)
    .from('activos_fijos')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('empresa_id', empresa_id)
    .select()
    .single() as { data: ActivoFijo | null; error: { message: string } | null }

  if (error) throw new Error(error.message)
  return result as ActivoFijo
}

export async function registrarDepreciacionMes(
  empresa_id: string,
  anio: number,
  mes: number
): Promise<{ registrados: number; monto_total: number }> {
  const supabase = await createClient()
  const activos = await getActivosFijos(empresa_id)
  const activos_activos = activos.filter((a) => a.estado === 'activo')

  let registrados = 0
  let monto_total = 0

  for (const activo of activos_activos) {
    const mesesDep = activo.meses_depreciados ?? 0
    if (mesesDep >= activo.vida_util_meses) continue

    const base = activo.valor_adquisicion - activo.valor_residual
    let monto = 0

    if (activo.metodo === 'lineal') {
      monto = base / activo.vida_util_meses
    } else {
      const restantes = activo.vida_util_meses - mesesDep
      const sumaDigitos = (activo.vida_util_meses * (activo.vida_util_meses + 1)) / 2
      monto = (base * restantes) / sumaDigitos
    }

    const yaDepreciado = activo.depreciacion_acumulada ?? 0
    monto = Math.min(monto, base - yaDepreciado)
    if (monto <= 0) continue

    const montoR = Math.round(monto * 100) / 100
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('depreciaciones').upsert(
      { activo_id: activo.id, empresa_id, anio, mes, monto: montoR },
      { onConflict: 'activo_id,anio,mes' }
    )

    if (!error) {
      registrados++
      monto_total += montoR
    }
  }

  return { registrados, monto_total }
}

// ============================================================
// RAZONES FINANCIERAS
// ============================================================

export async function getRazonesFinancieras(empresa_id: string): Promise<RazonesFinancierasData> {
  const hoy = new Date().toISOString().split('T')[0]
  const anio = new Date().getFullYear()
  const desde = `${anio}-01-01`

  const [balance, resultados] = await Promise.all([
    getBalanceGeneral(empresa_id, hoy),
    getEstadoResultados(empresa_id, desde, hoy),
  ])

  const activo_corriente = balance.activos
    .filter((a) => a.codigo.startsWith('1.1'))
    .reduce((s, a) => s + a.saldo, 0)

  const activo_no_corriente = balance.activos
    .filter((a) => !a.codigo.startsWith('1.1'))
    .reduce((s, a) => s + a.saldo, 0)

  const inventarios = balance.activos
    .filter(
      (a) =>
        a.codigo.startsWith('1.1.3') ||
        a.nombre.toLowerCase().includes('existencia') ||
        a.nombre.toLowerCase().includes('inventario') ||
        a.nombre.toLowerCase().includes('mercader')
    )
    .reduce((s, a) => s + a.saldo, 0)

  const pasivo_corriente = balance.pasivos
    .filter((p) => p.codigo.startsWith('2.1'))
    .reduce((s, p) => s + p.saldo, 0)

  const safe = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 100) / 100)
  const pct = (n: number, d: number) => (d === 0 ? null : Math.round((n / d) * 10000) / 100)

  return {
    activo_corriente,
    activo_no_corriente,
    inventarios,
    pasivo_corriente,
    total_activo: balance.total_activo,
    total_pasivo: balance.total_pasivo,
    total_patrimonio: balance.total_patrimonio,
    resultado_neto: resultados.resultado_neto,
    total_ingresos: resultados.total_ingresos,
    liquidez_corriente: safe(activo_corriente, pasivo_corriente),
    prueba_acida: safe(activo_corriente - inventarios, pasivo_corriente),
    endeudamiento: pct(balance.total_pasivo, balance.total_activo),
    endeudamiento_patrimonio: safe(balance.total_pasivo, balance.total_patrimonio),
    roa: pct(resultados.resultado_neto, balance.total_activo),
    roe: pct(resultados.resultado_neto, balance.total_patrimonio),
    margen_bruto: pct(resultados.resultado_bruto, resultados.total_ingresos),
    margen_neto: pct(resultados.resultado_neto, resultados.total_ingresos),
  }
}

// ============================================================
// ANTIGÜEDAD DE SALDOS
// ============================================================

export async function getAntiguedadSaldos(empresa_id: string): Promise<AntiguedadSaldosData> {
  const supabase = await createClient()
  const hoy = new Date()

  const [{ data: ventas }, { data: compras }] = await Promise.all([
    supabase
      .from('documentos_venta')
      .select('id, numero_documento, fecha_emision, fecha_vencimiento, total, cliente:clientes(rut, razon_social)')
      .eq('empresa_id', empresa_id)
      .not('estado', 'in', '("cobrado","anulado")')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('is_active' as any, true),
    supabase
      .from('documentos_compra')
      .select('id, numero_documento, fecha_emision, fecha_vencimiento, total, proveedor:proveedores(rut, razon_social)')
      .eq('empresa_id', empresa_id)
      .not('estado', 'in', '("pagado","anulado")')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq('is_active' as any, true),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildLineas(docs: any[], tipo: 'venta' | 'compra'): AntiguedadLinea[] {
    return (docs ?? []).map((d) => {
      const vencDate = d.fecha_vencimiento
        ? new Date(d.fecha_vencimiento)
        : new Date(new Date(d.fecha_emision).getTime() + 30 * 86_400_000)
      const dias = Math.floor((hoy.getTime() - vencDate.getTime()) / 86_400_000)
      const bucket: AntiguedadBucket =
        dias <= 0 ? '0-30' : dias <= 30 ? '0-30' : dias <= 60 ? '31-60' : dias <= 90 ? '61-90' : '90+'
      const tercero = tipo === 'venta' ? d.cliente : d.proveedor
      return {
        id: d.id,
        numero: d.numero_documento,
        rut: tercero?.rut ?? '',
        nombre: tercero?.razon_social ?? '',
        fecha_emision: d.fecha_emision,
        fecha_vencimiento: d.fecha_vencimiento ?? null,
        total: d.total,
        dias_vencido: Math.max(0, dias),
        bucket,
      }
    })
  }

  function sumaB(lineas: AntiguedadLinea[]) {
    return {
      '0-30':  lineas.filter((l) => l.bucket === '0-30').reduce((s, l) => s + l.total, 0),
      '31-60': lineas.filter((l) => l.bucket === '31-60').reduce((s, l) => s + l.total, 0),
      '61-90': lineas.filter((l) => l.bucket === '61-90').reduce((s, l) => s + l.total, 0),
      '90+':   lineas.filter((l) => l.bucket === '90+').reduce((s, l) => s + l.total, 0),
      total:   lineas.reduce((s, l) => s + l.total, 0),
    }
  }

  const cxc = buildLineas(ventas ?? [], 'venta')
  const cxp = buildLineas(compras ?? [], 'compra')

  return { cxc, cxp, totales_cxc: sumaB(cxc), totales_cxp: sumaB(cxp) }
}

// ============================================================
// PRESUPUESTO VS REAL
// ============================================================

export async function getPresupuestoVsReal(
  empresa_id: string,
  anio: number
): Promise<PresupuestoLinea[]> {
  const supabase = await createClient()

  const { data: comps } = await supabase
    .from('comprobantes')
    .select('id, fecha')
    .eq('empresa_id', empresa_id)
    .eq('estado', 'aprobado')
    .gte('fecha', `${anio}-01-01`)
    .lte('fecha', `${anio}-12-31`)

  const compMap = new Map((comps ?? []).map((c) => [c.id, new Date(c.fecha).getMonth()]))
  const ids = (comps ?? []).map((c) => c.id)

  const RESULT_CLASES = new Set(['ingreso', 'costo', 'gasto'])
  const realMap = new Map<string, { codigo: string; nombre: string; clase: string; saldo_normal: string; real: number[] }>()

  if (ids.length) {
    const { data: lineas } = await supabase
      .from('comprobante_lineas')
      .select('comprobante_id, debe, haber, cuenta:plan_cuentas!cuenta_id(id, codigo, nombre, clase, saldo_normal)')
      .in('comprobante_id', ids)

    for (const l of lineas ?? []) {
      const c = l.cuenta as unknown as { id: string; codigo: string; nombre: string; clase: string; saldo_normal: string } | null
      if (!c || !RESULT_CLASES.has(c.clase)) continue
      const mes = compMap.get(l.comprobante_id) ?? 0
      if (!realMap.has(c.id)) {
        realMap.set(c.id, { codigo: c.codigo, nombre: c.nombre, clase: c.clase, saldo_normal: c.saldo_normal, real: Array(12).fill(0) })
      }
      const entry = realMap.get(c.id)!
      const monto = c.saldo_normal === 'acreedor' ? l.haber - l.debe : l.debe - l.haber
      entry.real[mes] += monto
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: presupuestos } = await (supabase as any)
    .from('presupuestos_contables')
    .select('cuenta_id, mes, monto')
    .eq('empresa_id', empresa_id)
    .eq('anio', anio) as { data: { cuenta_id: string; mes: number; monto: number }[] | null }

  const presMap = new Map<string, number[]>()
  for (const p of presupuestos ?? []) {
    if (!presMap.has(p.cuenta_id)) presMap.set(p.cuenta_id, Array(12).fill(0))
    presMap.get(p.cuenta_id)![p.mes - 1] = p.monto
  }

  const budgetOnlyIds = [...presMap.keys()].filter((id) => !realMap.has(id))
  if (budgetOnlyIds.length) {
    const { data: bCuentas } = await supabase
      .from('plan_cuentas')
      .select('id, codigo, nombre, clase, saldo_normal')
      .in('id', budgetOnlyIds)
    for (const c of bCuentas ?? []) {
      if (RESULT_CLASES.has(c.clase))
        realMap.set(c.id, { codigo: c.codigo, nombre: c.nombre, clase: c.clase, saldo_normal: c.saldo_normal, real: Array(12).fill(0) })
    }
  }

  const result: PresupuestoLinea[] = []
  for (const [cuentaId, r] of realMap.entries()) {
    const presupuesto = presMap.get(cuentaId) ?? Array(12).fill(0)
    const total_real = r.real.reduce((s, v) => s + v, 0)
    const total_presupuesto = presupuesto.reduce((s, v) => s + v, 0)
    const variacion = total_real - total_presupuesto
    result.push({
      cuenta_id: cuentaId,
      codigo: r.codigo,
      nombre: r.nombre,
      clase: r.clase,
      presupuesto,
      real: r.real,
      total_presupuesto,
      total_real,
      variacion,
      variacion_pct: total_presupuesto === 0 ? 0 : Math.round((variacion / total_presupuesto) * 10000) / 100,
    })
  }

  return result.sort((a, b) => a.codigo.localeCompare(b.codigo))
}

export async function upsertPresupuesto(
  empresa_id: string,
  cuenta_id: string,
  anio: number,
  mes: number,
  monto: number
): Promise<void> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('presupuestos_contables').upsert(
    { empresa_id, cuenta_id, anio, mes, monto, updated_at: new Date().toISOString() },
    { onConflict: 'empresa_id,cuenta_id,anio,mes' }
  )
  if (error) throw new Error(error.message)
}

