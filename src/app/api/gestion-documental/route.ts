import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDocumento, deleteDocumento, archivarDocumento, getStorageUrl } from '@/services/gestion-documental.service'
import type { DocumentoGestion } from '@/types/gestion-documental.types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, tipo, nombre, descripcion, url_externo, storage_path, mime_type, tamano } = body
  if (!empresa_id || !tipo || !nombre) {
    return NextResponse.json({ ok: false, error: 'Campos requeridos: empresa_id, tipo, nombre' }, { status: 400 })
  }

  try {
    const doc = await createDocumento(empresa_id, {
      tipo, nombre, descripcion: descripcion || null,
      url_externo: url_externo || null,
      storage_path: storage_path || null,
      mime_type: mime_type || null,
      tamano: tamano ?? null,
      referencia_tabla: null, referencia_id: null,
    } as Omit<DocumentoGestion, 'id' | 'empresa_id' | 'created_at' | 'created_by' | 'estado'>)
    return NextResponse.json({ ok: true, doc })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ ok: false, error: 'path requerido' }, { status: 400 })

  const url = await getStorageUrl(path)
  return NextResponse.json({ ok: true, url })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { id, empresa_id } = await req.json()
  if (!id || !empresa_id) return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })

  try {
    await archivarDocumento(id, empresa_id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { id, empresa_id } = await req.json()
  if (!id || !empresa_id) return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })

  try {
    await deleteDocumento(id, empresa_id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}
