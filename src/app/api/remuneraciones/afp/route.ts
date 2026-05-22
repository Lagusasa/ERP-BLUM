import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { id, tasa } = body

  if (!id || tasa === undefined) return NextResponse.json({ error: 'ID y tasa requeridos' }, { status: 400 })
  if (typeof tasa !== 'number' || tasa < 0 || tasa > 1) {
    return NextResponse.json({ error: 'Tasa inválida (debe ser decimal entre 0 y 1)' }, { status: 400 })
  }

  const { error } = await supabase.from('afp').update({ tasa } as never).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
