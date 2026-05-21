import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertF22 } from '@/services/sii.service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { empresa_id, anio, datos_json } = await req.json()
  if (!empresa_id || !anio) return NextResponse.json({ ok: false, error: 'empresa_id y anio requeridos' }, { status: 400 })

  try {
    const data = await upsertF22(empresa_id, anio, datos_json ?? {})
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
