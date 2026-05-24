import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
  try {
    const { id, accion } = await req.json()
    if (!id || !accion) return NextResponse.json({ ok: false, error: 'id y accion requeridos' }, { status: 400 })
    if (!['cobrado', 'anulado'].includes(accion)) {
      return NextResponse.json({ ok: false, error: 'accion inválida' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const { error } = await supabase
      .from('documentos_venta')
      .update({ estado: accion, updated_at: new Date().toISOString() })
      .eq('id', id)
      .in('estado', ['emitido', 'contabilizado'])

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
