import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, anio, mes } = body as { empresa_id: string; anio: number; mes: number }

  if (!empresa_id || !anio || !mes) {
    return NextResponse.json({ ok: false, error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('periodos_contables')
    .insert({
      empresa_id,
      anio,
      mes,
      estado: 'abierto',
      fecha_apertura: new Date().toISOString(),
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
  const { id, estado } = body as { id: string; estado: 'abierto' | 'cerrado' }

  if (!id || !estado) {
    return NextResponse.json({ ok: false, error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('periodos_contables')
    .update({
      estado,
      fecha_cierre: estado === 'cerrado' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}
