import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { comprobante_id, empresa_id } = await req.json()
    if (!comprobante_id || !empresa_id) {
      return NextResponse.json({ ok: false, error: 'Parámetros requeridos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    // Obtener el comprobante original con sus líneas
    const { data: originalRaw, error: origErr } = await supabase
      .from('comprobantes')
      .select(`
        *,
        periodo:periodos_contables(*),
        lineas:comprobante_lineas(*)
      `)
      .eq('id', comprobante_id)
      .eq('empresa_id', empresa_id)
      .eq('estado', 'aprobado')
      .maybeSingle()

    if (origErr || !originalRaw) {
      return NextResponse.json({ ok: false, error: 'Comprobante no encontrado o no está aprobado' }, { status: 404 })
    }

    const original = originalRaw as unknown as {
      id: string; numero: number; tipo: string; periodo_id: string; total_debe: number; total_haber: number
      lineas: { cuenta_id: string; debe: number; haber: number; glosa: string | null; orden: number }[]
    }

    const hoy = new Date()
    const anioHoy = hoy.getFullYear()

    // Buscar período abierto actual o usar el mismo período del original
    const { data: periodo } = await supabase
      .from('periodos_contables')
      .select('id')
      .eq('empresa_id', empresa_id)
      .eq('anio', anioHoy)
      .eq('mes', hoy.getMonth() + 1)
      .in('estado', ['abierto'])
      .maybeSingle()

    const periodo_id = periodo?.id ?? original.periodo_id

    const { data: numero } = await supabase.rpc('siguiente_numero_comprobante', {
      p_empresa_id: empresa_id,
      p_anio: anioHoy,
    })

    const { data: reverso, error: revErr } = await supabase
      .from('comprobantes')
      .insert({
        empresa_id,
        periodo_id,
        numero: numero ?? 1,
        tipo: original.tipo,
        fecha: hoy.toISOString().split('T')[0],
        glosa: `Reverso — Comprobante #${original.numero}`,
        referencia: String(original.numero),
        total_debe: original.total_haber,
        total_haber: original.total_debe,
        estado: 'borrador',
      })
      .select()
      .single()

    if (revErr) throw new Error(revErr.message)

    // Insertar líneas con debe↔haber intercambiados
    const lineas = (original.lineas ?? []).map((l, idx) => ({
      comprobante_id: reverso.id,
      empresa_id,
      cuenta_id: l.cuenta_id,
      debe: l.haber,
      haber: l.debe,
      glosa: l.glosa ?? null,
      orden: idx,
    }))

    if (lineas.length > 0) {
      const { error: linErr } = await supabase.from('comprobante_lineas').insert(lineas)
      if (linErr) throw new Error(linErr.message)
    }

    return NextResponse.json({ ok: true, id: reverso.id, numero: reverso.numero })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
