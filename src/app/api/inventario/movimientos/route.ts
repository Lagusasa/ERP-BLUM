import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { registrarMovimiento } from '@/services/inventario.service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { empresa_id, producto_id, bodega_id, tipo, cantidad, costo_unitario, glosa } = await req.json()
  if (!empresa_id || !producto_id || !bodega_id || !tipo || !cantidad) {
    return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })
  }

  try {
    await registrarMovimiento(empresa_id, producto_id, bodega_id, tipo, Number(cantidad), Number(costo_unitario ?? 0), glosa ?? null)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}
