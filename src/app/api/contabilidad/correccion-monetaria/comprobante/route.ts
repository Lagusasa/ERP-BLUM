import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { empresa_id, anio, items } = await req.json()
    if (!empresa_id || !anio || !items?.length) {
      return NextResponse.json({ ok: false, error: 'Parámetros requeridos' }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar período diciembre del año
    const { data: periodo } = await supabase
      .from('periodos_contables')
      .select('id')
      .eq('empresa_id', empresa_id)
      .eq('anio', anio)
      .eq('mes', 12)
      .maybeSingle()

    if (!periodo) {
      return NextResponse.json({ ok: false, error: `No existe período diciembre ${anio}.` }, { status: 400 })
    }

    const fecha = `${anio}-12-31`
    const { data: numero } = await supabase.rpc('siguiente_numero_comprobante', {
      p_empresa_id: empresa_id,
      p_anio: anio,
    })

    const { data: comprobante, error: compErr } = await supabase
      .from('comprobantes')
      .insert({
        empresa_id,
        periodo_id: periodo.id,
        numero: numero ?? 1,
        tipo: 'correccion',
        fecha,
        glosa: `Corrección monetaria ejercicio ${anio} — art. 41 LIR`,
        total_debe: 0,
        total_haber: 0,
        estado: 'borrador',
      })
      .select()
      .single()

    if (compErr) throw new Error(compErr.message)

    // Construir líneas: positivos → activo debe, negativo → activo haber
    const lineas = items.flatMap((item: { cuenta_id: string; monto_correccion: number }, idx: number) => {
      if (item.monto_correccion === 0) return []
      return [{
        comprobante_id: comprobante.id,
        empresa_id,
        cuenta_id: item.cuenta_id,
        debe: item.monto_correccion > 0 ? Math.abs(item.monto_correccion) : 0,
        haber: item.monto_correccion < 0 ? Math.abs(item.monto_correccion) : 0,
        glosa: 'Corrección monetaria',
        orden: idx,
      }]
    })

    if (lineas.length) {
      const { error: linErr } = await supabase.from('comprobante_lineas').insert(lineas)
      if (linErr) throw new Error(linErr.message)
    }

    return NextResponse.json({ ok: true, numero })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
