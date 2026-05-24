import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { empresa_id, tipo, categoria, descripcion, monto, fecha, es_recurrente } = await req.json()

    if (!empresa_id || !tipo || !descripcion?.trim() || !monto || !fecha) {
      return NextResponse.json({ ok: false, error: 'Campos requeridos incompletos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('proyecciones_caja')
      .insert({
        empresa_id,
        tipo,
        categoria,
        descripcion: descripcion.trim(),
        monto: parseFloat(monto),
        fecha,
        es_recurrente: Boolean(es_recurrente),
        periodicidad: es_recurrente ? 'mensual' : null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const { error } = await supabase.from('proyecciones_caja').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
