import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const empresa_id = searchParams.get('empresa_id')
  const trabajador_id = searchParams.get('trabajador_id')
  const fecha_desde = searchParams.get('fecha_desde')
  const fecha_hasta = searchParams.get('fecha_hasta')

  if (!empresa_id) return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })

  const supabase = await createClient()
  let query = supabase
    .from('registro_asistencia')
    .select('*, trabajador:trabajadores(nombre, apellido_paterno, rut)')
    .eq('empresa_id', empresa_id)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (trabajador_id) query = query.eq('trabajador_id', trabajador_id)
  if (fecha_desde) query = query.gte('fecha', fecha_desde)
  if (fecha_hasta) query = query.lte('fecha', fecha_hasta)

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa_id, trabajador_id, fecha, hora_entrada, hora_salida, horas_extra, tipo, observacion } = body

  if (!empresa_id || !trabajador_id || !fecha) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const supabase = await createClient()

  // Calcular horas ordinarias si hay entrada y salida
  let horas_ordinarias = 0
  if (hora_entrada && hora_salida) {
    const [hE, mE] = hora_entrada.split(':').map(Number)
    const [hS, mS] = hora_salida.split(':').map(Number)
    const minutos = (hS * 60 + mS) - (hE * 60 + mE)
    horas_ordinarias = Math.max(0, Math.round((minutos / 60) * 100) / 100)
  }

  const { data, error } = await supabase
    .from('registro_asistencia')
    .insert({
      empresa_id,
      trabajador_id,
      fecha,
      hora_entrada: hora_entrada || null,
      hora_salida: hora_salida || null,
      horas_ordinarias,
      horas_extra: horas_extra ?? 0,
      tipo: tipo ?? 'entrada',
      observacion: observacion || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase.from('registro_asistencia').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
