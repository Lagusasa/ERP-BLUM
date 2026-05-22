import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, anio, ...campos } = body

  if (!empresa_id || !anio) return NextResponse.json({ error: 'empresa_id y anio requeridos' }, { status: 400 })

  const allowed = [
    'sueldo_minimo', 'uf_referencia', 'utm', 'tope_imponible_uf',
    'retencion_honorarios_pct', 'tasa_scs', 'tasa_mutualidad',
    'tasa_seg_ces_trab', 'tasa_seg_ces_emp_indef', 'tasa_seg_ces_emp_plazo',
  ]
  const payload: Record<string, unknown> = { empresa_id, anio }
  for (const k of allowed) {
    if (campos[k] !== undefined) payload[k] = campos[k]
  }

  const { error } = await supabase.from('indicadores_previsionales').upsert(payload as never, {
    onConflict: 'empresa_id,anio',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
