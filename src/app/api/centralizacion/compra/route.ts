import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contabilizarDocumentoCompra } from '@/services/centralizacion.service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { empresa_id, doc_id } = await req.json()
  if (!empresa_id || !doc_id) return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })

  const result = await contabilizarDocumentoCompra(empresa_id, doc_id)
  return NextResponse.json(result)
}
