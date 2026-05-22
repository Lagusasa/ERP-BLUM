import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ ok: false, error: 'ID requerido' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (fields.is_active !== undefined) updates.is_active = fields.is_active

  const { data, error } = await supabase.from('trabajadores').update(updates as any).eq('id', id).select().single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}
