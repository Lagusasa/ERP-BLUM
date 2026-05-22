import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, proveedor_rut, proveedor_nombre, fecha, numero_boleta, monto_bruto, retencion_pct, concepto, anio } = body

  if (!empresa_id || !proveedor_rut || !fecha || !monto_bruto) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await (supabase as any).from('pagos_honorarios').insert({
    empresa_id,
    proveedor_rut,
    proveedor_nombre: proveedor_nombre ?? null,
    fecha,
    numero_boleta: numero_boleta ?? null,
    monto_bruto,
    retencion_pct: retencion_pct ?? 0.1375,
    concepto: concepto ?? null,
    anio: anio ?? new Date(fecha).getFullYear(),
    estado: 'pendiente',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { id, estado } = body

  if (!id || !estado) return NextResponse.json({ error: 'ID y estado requeridos' }, { status: 400 })
  if (!['pendiente', 'pagado', 'anulado'].includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const { error } = await (supabase as any).from('pagos_honorarios').update({ estado }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
