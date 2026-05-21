import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crearMovimientoCaja } from '@/services/finanzas.service'
import type { MovimientoCaja } from '@/types/finanzas.types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, ...input } = body as { empresa_id: string } & Omit<MovimientoCaja, 'id' | 'empresa_id' | 'created_at' | 'cuenta'>

  if (!empresa_id || !input.cuenta_id || !input.tipo || !input.categoria || !input.descripcion || !input.monto || !input.fecha) {
    return NextResponse.json({ ok: false, error: 'Faltan campos requeridos' }, { status: 400 })
  }

  try {
    const data = await crearMovimientoCaja(empresa_id, input)
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
