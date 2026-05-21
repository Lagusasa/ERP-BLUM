import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { empresa_id } = await req.json()
  if (!empresa_id || typeof empresa_id !== 'string') {
    return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data } = await supabase
    .from('empresa_usuarios')
    .select('empresa_id')
    .eq('empresa_id', empresa_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return NextResponse.json({ error: 'Sin acceso a esta empresa' }, { status: 403 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('erpEmpresaId', empresa_id, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
