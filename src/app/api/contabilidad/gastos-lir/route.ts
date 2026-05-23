import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const empresa_id = searchParams.get('empresa_id')
    const anio = searchParams.get('anio')
    if (!empresa_id) return NextResponse.json({ ok: false, error: 'empresa_id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    let query = supabase
      .from('gastos_lir')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('fecha', { ascending: false })

    if (anio) query = query.eq('anio', Number(anio))

    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { empresa_id, cuenta_id, fecha, concepto, monto, articulo, tipo_gasto, rut_beneficiario, nombre_beneficiario } = body
    if (!empresa_id || !fecha || !monto || !articulo) {
      return NextResponse.json({ ok: false, error: 'Campos requeridos incompletos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const anio = new Date(fecha).getFullYear()

    const { data, error } = await supabase
      .from('gastos_lir')
      .insert({
        empresa_id,
        cuenta_id: cuenta_id || null,
        fecha,
        anio,
        concepto,
        monto: Number(monto),
        articulo,
        tipo_gasto: tipo_gasto || null,
        rut_beneficiario: rut_beneficiario || null,
        nombre_beneficiario: nombre_beneficiario || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const { error } = await supabase.from('gastos_lir').update({ is_active: false }).eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
