import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { empresa_id, ids, conciliado } = await req.json()
  if (!empresa_id || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('movimientos_caja')
    .update({ conciliado: conciliado ?? true } as any)
    .in('id', ids)
    .eq('empresa_id', empresa_id)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, updated: ids.length })
}
