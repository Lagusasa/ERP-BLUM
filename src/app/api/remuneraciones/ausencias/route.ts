import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const empresa_id = searchParams.get('empresa_id')
  const trabajador_id = searchParams.get('trabajador_id')
  const estado = searchParams.get('estado')

  if (!empresa_id) return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })

  const supabase = await createClient()
  let query = supabase
    .from('ausencias')
    .select('*, trabajador:trabajadores(nombre, apellido_paterno, rut)')
    .eq('empresa_id', empresa_id)
    .order('fecha_inicio', { ascending: false })

  if (trabajador_id) query = query.eq('trabajador_id', trabajador_id)
  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa_id, trabajador_id, tipo, fecha_inicio, fecha_fin, dias_habiles, dias_corridos, motivo, numero_licencia } = body

  if (!empresa_id || !trabajador_id || !tipo || !fecha_inicio || !fecha_fin) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }
  if (fecha_fin < fecha_inicio) {
    return NextResponse.json({ error: 'fecha_fin no puede ser anterior a fecha_inicio' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('ausencias')
    .insert({
      empresa_id,
      trabajador_id,
      tipo,
      fecha_inicio,
      fecha_fin,
      dias_habiles: dias_habiles ?? 0,
      dias_corridos: dias_corridos ?? 0,
      estado: 'pendiente',
      motivo: motivo || null,
      numero_licencia: numero_licencia || null,
      aprobado_por: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, estado } = body
  if (!id || !estado) return NextResponse.json({ error: 'id y estado requeridos' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const update = estado === 'aprobada'
    ? { estado, aprobado_por: user?.id ?? null }
    : { estado }

  const { data, error } = await supabase
    .from('ausencias')
    .update(update as { estado: string; aprobado_por?: string | null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
