import { createClient } from '@/lib/supabase/server'

export interface BiResumenAnual {
  anio: number
  meses: BiMes[]
  totales: {
    ventas: number
    compras: number
    resultado: number
    masa_salarial: number
    flujo_caja: number
  }
}

export interface BiMes {
  mes: number
  nombre: string
  ventas: number
  compras: number
  resultado: number
  masa_salarial: number
  flujo_ingreso: number
  flujo_egreso: number
}

export interface BiKpiEjecutivo {
  ventas_mes: number
  ventas_mes_anterior: number
  compras_mes: number
  resultado_mes: number
  saldo_caja: number
  trabajadores_activos: number
  dtes_pendientes: number
  stock_bajo_minimo: number
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export async function getKpiEjecutivo(empresa_id: string): Promise<BiKpiEjecutivo> {
  const supabase = await createClient()
  const ahora = new Date()
  const mes = ahora.getMonth() + 1
  const anio = ahora.getFullYear()
  const desde = `${anio}-${String(mes).padStart(2, '0')}-01`
  const hasta = ahora.toISOString().split('T')[0]

  const mesAnt = mes === 1 ? 12 : mes - 1
  const anioAnt = mes === 1 ? anio - 1 : anio
  const desdeAnt = `${anioAnt}-${String(mesAnt).padStart(2, '0')}-01`
  const hastaAnt = `${anioAnt}-${String(mesAnt).padStart(2, '0')}-${new Date(anioAnt, mesAnt, 0).getDate()}`

  const [
    { data: ventasMes },
    { data: ventasAnt },
    { data: comprasMes },
    { data: cuentas },
    { data: trabajadores },
    { data: dtePend },
    { data: stockBajo },
  ] = await Promise.all([
    supabase.from('documentos_venta').select('total').eq('empresa_id', empresa_id).gte('fecha_emision', desde).lte('fecha_emision', hasta),
    supabase.from('documentos_venta').select('total').eq('empresa_id', empresa_id).gte('fecha_emision', desdeAnt).lte('fecha_emision', hastaAnt),
    supabase.from('documentos_compra').select('total').eq('empresa_id', empresa_id).gte('fecha_emision', desde).lte('fecha_emision', hasta),
    supabase.from('cuentas_bancarias').select('saldo_actual').eq('empresa_id', empresa_id).eq('is_active', true),
    supabase.from('trabajadores').select('id').eq('empresa_id', empresa_id).eq('is_active', true),
    supabase.from('dte_documentos').select('id').eq('empresa_id', empresa_id).eq('estado', 'pendiente'),
    supabase.from('productos').select('id').eq('empresa_id', empresa_id).eq('is_active', true),
  ])

  const sumVentasMes  = (ventasMes  ?? []).reduce((s, d) => s + (d.total ?? 0), 0)
  const sumVentasAnt  = (ventasAnt  ?? []).reduce((s, d) => s + (d.total ?? 0), 0)
  const sumComprasMes = (comprasMes ?? []).reduce((s, d) => s + (d.total ?? 0), 0)
  const saldoCaja     = (cuentas    ?? []).reduce((s, c) => s + (c.saldo_actual ?? 0), 0)

  return {
    ventas_mes:          sumVentasMes,
    ventas_mes_anterior: sumVentasAnt,
    compras_mes:         sumComprasMes,
    resultado_mes:       sumVentasMes - sumComprasMes,
    saldo_caja:          saldoCaja,
    trabajadores_activos: (trabajadores ?? []).length,
    dtes_pendientes:     (dtePend     ?? []).length,
    stock_bajo_minimo:   0,  // Calculado directamente en la tabla stock_bodega si es necesario
  }
}

export async function getResumenAnual(empresa_id: string, anio: number): Promise<BiResumenAnual> {
  const supabase = await createClient()

  const [
    { data: ventas },
    { data: compras },
    { data: liquidaciones },
    { data: movCaja },
  ] = await Promise.all([
    supabase.from('documentos_venta')
      .select('fecha_emision, total')
      .eq('empresa_id', empresa_id)
      .gte('fecha_emision', `${anio}-01-01`)
      .lte('fecha_emision', `${anio}-12-31`),
    supabase.from('documentos_compra')
      .select('fecha_emision, total')
      .eq('empresa_id', empresa_id)
      .gte('fecha_emision', `${anio}-01-01`)
      .lte('fecha_emision', `${anio}-12-31`),
    supabase.from('liquidaciones')
      .select('periodo_mes, total_imponible')
      .eq('empresa_id', empresa_id)
      .eq('periodo_anio', anio),
    supabase.from('movimientos_caja')
      .select('fecha, tipo, monto')
      .eq('empresa_id', empresa_id)
      .gte('fecha', `${anio}-01-01`)
      .lte('fecha', `${anio}-12-31`),
  ])

  const ventasByMes: Record<number, number>  = {}
  const comprasByMes: Record<number, number> = {}
  const remByMes: Record<number, number>     = {}
  const ingresosByMes: Record<number, number> = {}
  const egresosByMes: Record<number, number>  = {}

  for (const r of ventas ?? []) {
    const m = new Date(r.fecha_emision).getMonth() + 1
    ventasByMes[m] = (ventasByMes[m] ?? 0) + (r.total ?? 0)
  }
  for (const r of compras ?? []) {
    const m = new Date(r.fecha_emision).getMonth() + 1
    comprasByMes[m] = (comprasByMes[m] ?? 0) + (r.total ?? 0)
  }
  for (const r of liquidaciones ?? []) {
    remByMes[r.periodo_mes] = (remByMes[r.periodo_mes] ?? 0) + (r.total_imponible ?? 0)
  }
  for (const m of movCaja ?? []) {
    const mes = new Date(m.fecha).getMonth() + 1
    if (m.tipo === 'ingreso') ingresosByMes[mes] = (ingresosByMes[mes] ?? 0) + (m.monto ?? 0)
    else egresosByMes[mes] = (egresosByMes[mes] ?? 0) + (m.monto ?? 0)
  }

  const meses: BiMes[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    return {
      mes: m,
      nombre: MESES[i],
      ventas:        ventasByMes[m]   ?? 0,
      compras:       comprasByMes[m]  ?? 0,
      resultado:     (ventasByMes[m] ?? 0) - (comprasByMes[m] ?? 0),
      masa_salarial: remByMes[m]      ?? 0,
      flujo_ingreso: ingresosByMes[m] ?? 0,
      flujo_egreso:  egresosByMes[m]  ?? 0,
    }
  })

  const totales = meses.reduce(
    (acc, m) => ({
      ventas:        acc.ventas       + m.ventas,
      compras:       acc.compras      + m.compras,
      resultado:     acc.resultado    + m.resultado,
      masa_salarial: acc.masa_salarial + m.masa_salarial,
      flujo_caja:    acc.flujo_caja   + m.flujo_ingreso - m.flujo_egreso,
    }),
    { ventas: 0, compras: 0, resultado: 0, masa_salarial: 0, flujo_caja: 0 }
  )

  return { anio, meses, totales }
}
