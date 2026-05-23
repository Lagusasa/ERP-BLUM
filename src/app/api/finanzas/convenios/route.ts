import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const empresa_id = searchParams.get('empresa_id')
    if (!empresa_id) return NextResponse.json({ ok: false, error: 'empresa_id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('convenios_pago')
      .select('*, cuotas:convenio_cuotas(*)')
      .eq('empresa_id', empresa_id)
      .order('fecha_inicio', { ascending: false })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { empresa_id, acreedor, tipo, monto_total, n_cuotas, fecha_inicio, tasa_interes, descripcion } = body
    if (!empresa_id || !acreedor || !monto_total || !n_cuotas || !fecha_inicio) {
      return NextResponse.json({ ok: false, error: 'Campos requeridos incompletos' }, { status: 400 })
    }

    const supabase = await createClient()
    const montoCuota = Math.round(Number(monto_total) / Number(n_cuotas))

    const { data: convenio, error } = await supabase
      .from('convenios_pago')
      .insert({
        empresa_id, acreedor, tipo: tipo || 'proveedor',
        monto_total: Number(monto_total), n_cuotas: Number(n_cuotas),
        monto_cuota: montoCuota, fecha_inicio,
        tasa_interes: Number(tasa_interes || 0), descripcion: descripcion || null,
        estado: 'vigente', is_active: true,
      })
      .select().single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    // Generar cuotas automáticamente
    const cuotas = Array.from({ length: Number(n_cuotas) }, (_, i) => {
      const fecha = new Date(fecha_inicio)
      fecha.setMonth(fecha.getMonth() + i)
      return {
        convenio_id: convenio.id,
        empresa_id,
        numero: i + 1,
        fecha_vencimiento: fecha.toISOString().split('T')[0],
        monto: montoCuota,
        estado: 'pendiente',
      }
    })

    await supabase.from('convenio_cuotas').insert(cuotas)

    return NextResponse.json({ ok: true, data: convenio })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, cuota_id, accion } = await req.json()
    const supabase = await createClient()

    if (cuota_id && accion === 'pagar') {
      const { error } = await supabase
        .from('convenio_cuotas')
        .update({ estado: 'pagada', fecha_pago: new Date().toISOString().split('T')[0] })
        .eq('id', cuota_id)
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    if (id && accion === 'terminar') {
      const { error } = await supabase.from('convenios_pago').update({ estado: 'terminado' }).eq('id', id)
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
