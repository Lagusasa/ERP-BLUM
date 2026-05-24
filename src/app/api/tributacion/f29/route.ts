import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { empresa_id, mes, anio, debito_fiscal, credito_fiscal, iva_a_pagar, remanente, es_rectificatoria } = await req.json()

    if (!empresa_id || !mes || !anio) {
      return NextResponse.json({ ok: false, error: 'empresa_id, mes y anio requeridos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const estado = es_rectificatoria ? 'rectificatoria' : 'presentada'
    const hoy = new Date().toISOString().split('T')[0]

    const payload = {
      empresa_id,
      periodo_mes: mes,
      periodo_anio: anio,
      estado,
      debito_ventas_afectas: Math.round(debito_fiscal),
      debito_notas_credito: 0,
      debito_notas_debito: 0,
      total_debito_fiscal: Math.round(debito_fiscal),
      credito_compras: Math.round(credito_fiscal),
      credito_activo_fijo: 0,
      credito_notas_credito: 0,
      credito_notas_debito: 0,
      total_credito_fiscal: Math.round(credito_fiscal),
      iva_a_pagar: Math.round(iva_a_pagar),
      remanente_credito: Math.round(remanente),
      ppm_base_imponible: 0,
      ppm_tasa: 0,
      ppm_monto: 0,
      total_a_pagar: Math.round(iva_a_pagar),
      fecha_presentacion: hoy,
      created_by: user.id,
    }

    const { data, error } = await supabase
      .from('declaraciones_f29')
      .upsert(payload, { onConflict: 'empresa_id,periodo_mes,periodo_anio' })
      .select('id')
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
