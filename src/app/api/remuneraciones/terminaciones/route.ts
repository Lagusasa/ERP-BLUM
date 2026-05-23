import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const empresa_id = searchParams.get('empresa_id')
  if (!empresa_id) return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('terminaciones_contrato')
    .select('*, trabajador:trabajadores(nombre, apellido_paterno, rut)')
    .eq('empresa_id', empresa_id)
    .order('fecha_termino', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    empresa_id, trabajador_id, contrato_id,
    fecha_termino, causal, descripcion,
    preaviso_dias, indemnizacion_anios, indemnizacion_monto,
    vacaciones_pendientes, monto_total_finiquito, ministro_de_fe,
  } = body

  if (!empresa_id || !trabajador_id || !contrato_id || !fecha_termino || !causal) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: terminacion, error: e1 } = await supabase
    .from('terminaciones_contrato')
    .insert({
      empresa_id,
      trabajador_id,
      contrato_id,
      fecha_termino,
      causal,
      descripcion: descripcion || null,
      preaviso_dias: preaviso_dias ?? 0,
      indemnizacion_anios: indemnizacion_anios ?? 0,
      indemnizacion_monto: indemnizacion_monto ?? 0,
      vacaciones_pendientes: vacaciones_pendientes ?? 0,
      monto_total_finiquito: monto_total_finiquito ?? 0,
      ministro_de_fe: ministro_de_fe || null,
      firmado: false,
    })
    .select()
    .single()

  if (e1 || !terminacion) return NextResponse.json({ error: e1?.message ?? 'Error al crear' }, { status: 500 })

  // Desactivar contrato
  await supabase
    .from('contratos')
    .update({ es_activo: false, fecha_termino })
    .eq('id', contrato_id)

  // Desactivar trabajador
  await supabase
    .from('trabajadores')
    .update({ is_active: false })
    .eq('id', trabajador_id)

  return NextResponse.json(terminacion)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, firmado, fecha_firma, ministro_de_fe } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('terminaciones_contrato')
    .update({ firmado, fecha_firma, ministro_de_fe })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
