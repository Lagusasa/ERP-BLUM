import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const empresa_id = searchParams.get('empresa_id')
  const mes = searchParams.get('mes')
  const anio = searchParams.get('anio')

  if (!empresa_id || !mes || !anio) {
    return NextResponse.json({ error: 'empresa_id, mes y anio requeridos' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: liquidaciones, error } = await supabase
    .from('liquidaciones')
    .select(`
      id, trabajador_id, estado,
      total_imponible, afp_monto, afp_comision, afp_sis,
      isapre_monto, seguro_cesantia,
      aporte_scs, aporte_mutualidad, aporte_seguro_ces_emp,
      trabajador:trabajadores(
        nombre, apellido_paterno, rut,
        afp:afp(nombre),
        isapre:isapres(nombre),
        mutualidad:mutualidades(nombre)
      )
    `)
    .eq('empresa_id', empresa_id)
    .eq('periodo_mes', parseInt(mes))
    .eq('periodo_anio', parseInt(anio))
    .neq('estado', 'anulada')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = (liquidaciones ?? []).map((l: Record<string, unknown>) => ({
    ...l,
    cotizacion_afp_base: Math.round(((l.afp_monto as number) ?? 0) - ((l.afp_comision as number) ?? 0) - ((l.afp_sis as number) ?? 0)),
    afp_comision: (l.afp_comision as number) ?? 0,
    afp_sis: (l.afp_sis as number) ?? 0,
  }))

  const totales = {
    total_afp: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.afp_monto as number) ?? 0), 0),
    total_afp_comision: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.afp_comision as number) ?? 0), 0),
    total_afp_sis: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.afp_sis as number) ?? 0), 0),
    total_isapre: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.isapre_monto as number) ?? 0), 0),
    total_seg_ces_trab: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.seguro_cesantia as number) ?? 0), 0),
    total_aporte_emp: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.aporte_scs as number) ?? 0) + ((l.aporte_mutualidad as number) ?? 0) + ((l.aporte_seguro_ces_emp as number) ?? 0), 0),
    total_mutualidad: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.aporte_mutualidad as number) ?? 0), 0),
    total_seg_ces_emp: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.aporte_seguro_ces_emp as number) ?? 0), 0),
    total_scs: items.reduce((s: number, l: Record<string, unknown>) => s + ((l.aporte_scs as number) ?? 0), 0),
  }

  return NextResponse.json({ liquidaciones: items, totales, mes: parseInt(mes), anio: parseInt(anio) })
}
