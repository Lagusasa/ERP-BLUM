import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const empresa_id = searchParams.get('empresa_id')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    let query = supabase
      .from('roles')
      .select('id, nombre, descripcion, es_sistema, empresa_id, is_active, created_at')
      .eq('is_active', true)
      .order('es_sistema', { ascending: false })
      .order('nombre')

    if (empresa_id) {
      query = query.or(`empresa_id.eq.${empresa_id},empresa_id.is.null`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { empresa_id, nombre, descripcion } = await req.json()
    if (!empresa_id || !nombre?.trim()) {
      return NextResponse.json({ ok: false, error: 'empresa_id y nombre requeridos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const { data, error } = await supabase
      .from('roles')
      .insert({
        empresa_id,
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        es_sistema: false,
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

export async function PATCH(req: Request) {
  try {
    const { id, nombre, descripcion, is_active } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: 'id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    const updates: { updated_at: string; nombre?: string; descripcion?: string | null; is_active?: boolean } = {
      updated_at: new Date().toISOString(),
    }
    if (nombre !== undefined) updates.nombre = nombre.trim()
    if (descripcion !== undefined) updates.descripcion = descripcion?.trim() || null
    if (is_active !== undefined) updates.is_active = Boolean(is_active)

    const { error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .eq('es_sistema', false)

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
