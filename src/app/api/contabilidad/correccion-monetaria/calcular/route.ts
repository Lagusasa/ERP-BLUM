import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { empresa_id, anio, uf_inicio, uf_fin } = await req.json()
    if (!empresa_id || !anio || !uf_inicio || !uf_fin) {
      return NextResponse.json({ ok: false, error: 'Parámetros requeridos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const factor = uf_fin / uf_inicio

    // Saldos al inicio del año (01/01/anio) desde el libro mayor
    // Tomamos comprobantes aprobados hasta el 31/12 del año anterior
    const hastaAnterior = `${anio - 1}-12-31`

    const { data: lineas } = await supabase
      .from('comprobante_lineas')
      .select(`
        cuenta_id,
        debe,
        haber,
        comprobante:comprobantes!inner(fecha, estado, empresa_id)
      `)
      .eq('comprobante.empresa_id', empresa_id)
      .eq('comprobante.estado', 'aprobado')
      .lte('comprobante.fecha', hastaAnterior)

    if (!lineas?.length) {
      return NextResponse.json({ ok: true, items: [] })
    }

    // Agrupar saldos por cuenta
    const saldos = new Map<string, number>()
    for (const l of lineas) {
      const actual = saldos.get(l.cuenta_id) ?? 0
      saldos.set(l.cuenta_id, actual + l.debe - l.haber)
    }

    // Obtener info de cuentas activo/patrimonio no monetarias
    const cuentaIds = Array.from(saldos.keys())
    const { data: cuentas } = await supabase
      .from('plan_cuentas')
      .select('id, codigo, nombre, clase')
      .in('id', cuentaIds)
      .in('clase', ['activo', 'patrimonio'])
      .eq('empresa_id', empresa_id)
      .eq('es_imputable', true)

    const items = (cuentas ?? [])
      .map((c) => {
        const saldo = saldos.get(c.id) ?? 0
        const monto_correccion = Math.round(saldo * (factor - 1))
        return {
          cuenta_id: c.id,
          cuenta_codigo: c.codigo,
          cuenta_nombre: c.nombre,
          saldo,
          uf_inicio,
          uf_fin,
          monto_correccion,
        }
      })
      .filter((i) => i.saldo !== 0)

    return NextResponse.json({ ok: true, items })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
