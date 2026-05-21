import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRliAjuste, deleteRliAjuste } from '@/services/rli.service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { empresa_id, anio, tipo, concepto, monto } = await req.json()
  if (!empresa_id || !anio || !tipo || !concepto || monto == null) {
    return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })
  }

  try {
    const ajuste = await createRliAjuste(empresa_id, Number(anio), tipo, concepto, Number(monto))
    return NextResponse.json({ ok: true, ajuste })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { id, empresa_id } = await req.json()
  if (!id || !empresa_id) return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })

  try {
    await deleteRliAjuste(id, empresa_id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}
