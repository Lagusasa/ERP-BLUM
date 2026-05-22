import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Allows a user to join an empresa they created (repairs missing empresa_usuarios records)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { empresa_id } = await req.json()
    if (!empresa_id) return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })

    // Verify the empresa exists and was created by this user (or user is already a member)
    const { data: empresa } = await supabase
      .from('empresas')
      .select('id, razon_social, created_by')
      .eq('id', empresa_id)
      .maybeSingle()

    if (!empresa) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    if (empresa.created_by !== user.id) {
      return NextResponse.json({ error: 'Solo el creador puede auto-unirse' }, { status: 403 })
    }

    // Upsert empresa_usuarios
    const { data: rolAdmin } = await supabase
      .from('roles')
      .select('id')
      .eq('nombre', 'Administrador')
      .is('empresa_id', null)
      .maybeSingle()

    const { error } = await supabase.from('empresa_usuarios').upsert(
      {
        empresa_id,
        user_id: user.id,
        rol_id: rolAdmin?.id ?? null,
        is_active: true,
        created_by: user.id,
      },
      { onConflict: 'empresa_id,user_id' }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Set as active empresa
    const res = NextResponse.json({ ok: true })
    res.cookies.set('erpEmpresaId', empresa_id, {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
