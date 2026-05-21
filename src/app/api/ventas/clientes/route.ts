import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, rut, razon_social, nombre_fantasia, giro, email, telefono, direccion, comuna, ciudad, limite_credito, condicion_pago } = body

  if (!empresa_id || !rut || !razon_social) {
    return NextResponse.json({ ok: false, error: 'RUT y Razón Social son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      empresa_id,
      rut,
      razon_social,
      nombre_fantasia:  nombre_fantasia  || null,
      giro:             giro             || null,
      email:            email            || null,
      telefono:         telefono         || null,
      direccion:        direccion        || null,
      comuna:           comuna           || null,
      ciudad:           ciudad           || null,
      limite_credito:   limite_credito   ? Number(limite_credito) : null,
      condicion_pago:   condicion_pago   || null,
      is_active:        true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}
