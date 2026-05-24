import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, rol_id, is_active } = body
    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const updates: { updated_at: string; rol_id?: string | null; is_active?: boolean } = {
      updated_at: new Date().toISOString(),
    }
    if (rol_id !== undefined) updates.rol_id = rol_id || null
    if (is_active !== undefined) updates.is_active = Boolean(is_active)

    const { error } = await supabase
      .from('empresa_usuarios')
      .update(updates)
      .eq('id', id)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
