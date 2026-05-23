import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, rut, razon_social, nombre_fantasia, giro, email, telefono, direccion, comuna, ciudad, condicion_pago } = body

  if (!empresa_id || !rut || !razon_social) {
    return NextResponse.json({ ok: false, error: 'RUT y Razón Social son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('proveedores')
    .insert({
      empresa_id, rut, razon_social,
      nombre_fantasia: nombre_fantasia || null,
      giro:            giro            || null,
      email:           email           || null,
      telefono:        telefono        || null,
      direccion:       direccion       || null,
      comuna:          comuna          || null,
      ciudad:          ciudad          || null,
      condicion_pago:  condicion_pago != null ? Number(condicion_pago) : null,
      is_active:       true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ ok: false, error: 'ID requerido' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (fields.razon_social    !== undefined) updates.razon_social    = fields.razon_social
  if (fields.nombre_fantasia !== undefined) updates.nombre_fantasia = fields.nombre_fantasia || null
  if (fields.giro            !== undefined) updates.giro            = fields.giro            || null
  if (fields.email           !== undefined) updates.email           = fields.email           || null
  if (fields.telefono        !== undefined) updates.telefono        = fields.telefono        || null
  if (fields.direccion       !== undefined) updates.direccion       = fields.direccion       || null
  if (fields.comuna          !== undefined) updates.comuna          = fields.comuna          || null
  if (fields.ciudad          !== undefined) updates.ciudad          = fields.ciudad          || null
  if (fields.condicion_pago  !== undefined) updates.condicion_pago  = fields.condicion_pago != null ? Number(fields.condicion_pago) : null
  if (fields.is_active       !== undefined) updates.is_active       = fields.is_active

  const { data, error } = await supabase.from('proveedores').update(updates as any).eq('id', id).select().single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}
