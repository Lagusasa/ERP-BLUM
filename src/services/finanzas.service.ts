import { createClient } from '@/lib/supabase/server'
import type { CuentaBancaria, MovimientoCaja, ProyeccionCaja, ResumenCaja } from '@/types/finanzas.types'

export async function getCuentasBancarias(empresa_id: string): Promise<CuentaBancaria[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .select('*')
    .eq('empresa_id', empresa_id)
    .eq('is_active', true)
    .order('banco')

  if (error) throw new Error(error.message)
  return (data ?? []) as CuentaBancaria[]
}

export async function getMovimientosCaja(
  empresa_id: string,
  desde?: string,
  hasta?: string,
  cuenta_id?: string
): Promise<MovimientoCaja[]> {
  const supabase = await createClient()
  let query = supabase
    .from('movimientos_caja')
    .select('*, cuenta:cuentas_bancarias(banco, numero_cuenta)')
    .eq('empresa_id', empresa_id)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  if (desde)     query = query.gte('fecha', desde)
  if (hasta)     query = query.lte('fecha', hasta)
  if (cuenta_id) query = query.eq('cuenta_id', cuenta_id)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as MovimientoCaja[]
}

export async function getResumenCaja(empresa_id: string): Promise<ResumenCaja> {
  const supabase = await createClient()
  const ahora = new Date()
  const desde = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`
  const hasta = ahora.toISOString().split('T')[0]

  const [cuentas, movMes] = await Promise.all([
    getCuentasBancarias(empresa_id),
    getMovimientosCaja(empresa_id, desde, hasta),
  ])

  const saldo_total    = cuentas.reduce((s, c) => s + c.saldo_actual, 0)
  const ingresos_mes   = movMes.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresos_mes    = movMes.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)

  const cuentasConFlujo = cuentas.map((c) => ({
    ...c,
    ingresos: movMes.filter((m) => m.cuenta_id === c.id && m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0),
    egresos:  movMes.filter((m) => m.cuenta_id === c.id && m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0),
  }))

  return { saldo_total, ingresos_mes, egresos_mes, flujo_neto: ingresos_mes - egresos_mes, cuentas: cuentasConFlujo }
}

export async function crearMovimientoCaja(
  empresa_id: string,
  input: Omit<MovimientoCaja, 'id' | 'empresa_id' | 'created_at' | 'cuenta'>
): Promise<MovimientoCaja> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('movimientos_caja')
    .insert({ ...input, empresa_id, created_by: user?.id ?? null })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Actualizar saldo de la cuenta
  const delta = input.tipo === 'ingreso' ? input.monto : -input.monto
  await supabase
    .from('cuentas_bancarias')
    .update({ saldo_actual: (await getCuentasBancarias(empresa_id))
      .find((c) => c.id === input.cuenta_id)!.saldo_actual + delta })
    .eq('id', input.cuenta_id)

  return data as MovimientoCaja
}

export async function getProyecciones(empresa_id: string, desde: string, hasta: string): Promise<ProyeccionCaja[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proyecciones_caja')
    .select('*')
    .eq('empresa_id', empresa_id)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha')

  if (error) throw new Error(error.message)
  return (data ?? []) as ProyeccionCaja[]
}
