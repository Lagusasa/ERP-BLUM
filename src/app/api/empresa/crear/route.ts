import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateEmpresaInput } from '@/services/admin.service'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const input: CreateEmpresaInput = await req.json()
    if (!input.razon_social?.trim()) return NextResponse.json({ error: 'Razón social requerida' }, { status: 400 })
    if (!input.rut?.trim()) return NextResponse.json({ error: 'RUT requerido' }, { status: 400 })

    // Insert empresa
    const { data: empresa, error: errEmpresa } = await supabase
      .from('empresas')
      .insert({
        razon_social: input.razon_social.trim(),
        rut: input.rut.trim(),
        giro: input.giro || null,
        email: input.email || null,
        telefono: input.telefono || null,
        direccion: input.direccion || null,
        comuna: input.comuna || null,
        ciudad: input.ciudad || null,
        representante_legal: input.representante_legal || null,
        is_active: true,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (errEmpresa || !empresa) {
      return NextResponse.json({ error: errEmpresa?.message ?? 'Error al crear empresa' }, { status: 400 })
    }

    // Insert empresa_usuarios — se hace desde el server para evitar problemas de RLS circulares
    const { data: rolAdmin } = await supabase
      .from('roles')
      .select('id')
      .eq('nombre', 'Administrador')
      .is('empresa_id', null)
      .maybeSingle()

    const { error: errEU } = await supabase.from('empresa_usuarios').insert({
      empresa_id: empresa.id,
      user_id: user.id,
      rol_id: rolAdmin?.id ?? null,
      is_active: true,
      created_by: user.id,
    })

    if (errEU) {
      // Empresa created but membership failed — log and warn
      console.error('[crear empresa] empresa_usuarios insert error:', errEU.message)
      return NextResponse.json({
        id: empresa.id,
        warning: 'Empresa creada pero no se pudo asignar el usuario: ' + errEU.message,
      }, { status: 201 })
    }

    // Set active empresa cookie
    const res = NextResponse.json({ id: empresa.id }, { status: 201 })
    res.cookies.set('erpEmpresaId', empresa.id, {
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
