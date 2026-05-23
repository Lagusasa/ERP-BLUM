import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const empresa_id = searchParams.get('empresa_id')
    if (!empresa_id) return NextResponse.json({ ok: false, error: 'empresa_id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('devolucion_iva_exportador')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('periodo', { ascending: false })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { empresa_id, periodo, monto_iva_exportaciones, monto_solicitado, numero_solicitud, estado, observacion } = body
    if (!empresa_id || !periodo || !monto_solicitado) {
      return NextResponse.json({ ok: false, error: 'Campos requeridos incompletos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('devolucion_iva_exportador')
      .insert({
        empresa_id, periodo, monto_iva_exportaciones: Number(monto_iva_exportaciones || 0),
        monto_solicitado: Number(monto_solicitado), numero_solicitud: numero_solicitud || null,
        estado: estado || 'pendiente', observacion: observacion || null, is_active: true,
      })
      .select().single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, estado, observacion } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('devolucion_iva_exportador')
      .update({ estado, observacion })
      .eq('id', id)
      .select().single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
