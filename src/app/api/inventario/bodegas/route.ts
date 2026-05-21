import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { empresa_id, codigo, nombre, ubicacion } = await req.json()
  if (!empresa_id || !codigo || !nombre) {
    return NextResponse.json({ ok: false, error: 'empresa_id, codigo y nombre son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bodegas')
    .insert({ empresa_id, codigo, nombre, ubicacion: ubicacion ?? null, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message })
  return NextResponse.json({ ok: true, bodega: data })
}
