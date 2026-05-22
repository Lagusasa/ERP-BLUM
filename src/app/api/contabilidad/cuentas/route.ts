import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, codigo, nombre, clase, tipo, nivel, saldo_normal, es_imputable, cuenta_padre_id } = body

  if (!empresa_id || !codigo || !nombre || !clase || !tipo || !saldo_normal) {
    return NextResponse.json({ ok: false, error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from('plan_cuentas')
    .insert({
      empresa_id,
      codigo,
      nombre,
      clase,
      tipo,
      nivel: nivel ?? codigo.split('.').length,
      saldo_normal,
      es_imputable: es_imputable ?? tipo === 'detalle',
      cuenta_padre_id: cuenta_padre_id || null,
      is_active: true,
      permite_ajuste: false,
    } as any)
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}
