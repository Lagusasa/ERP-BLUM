import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TipoBoleta } from '@/types/sii.types'

interface HonImportRow {
  tipo: string
  numero: number
  rut_prestador: string
  nombre_prestador: string
  rut_pagador: string
  nombre_pagador: string | null
  fecha: string
  monto_bruto: number
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, boletas } = body as { empresa_id: string; boletas: HonImportRow[] }

  if (!empresa_id || !Array.isArray(boletas) || boletas.length === 0) {
    return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 })
  }

  const VALID_TIPOS: TipoBoleta[] = ['emitida', 'recibida']

  const rows = boletas.map((b) => ({
    empresa_id,
    tipo:             (VALID_TIPOS.includes(b.tipo as TipoBoleta) ? b.tipo : 'recibida') as TipoBoleta,
    numero:           Number(b.numero),
    rut_prestador:    String(b.rut_prestador),
    nombre_prestador: String(b.nombre_prestador),
    rut_pagador:      String(b.rut_pagador || ''),
    nombre_pagador:   b.nombre_pagador || null,
    fecha:            String(b.fecha),
    monto_bruto:      Number(b.monto_bruto) || 0,
    concepto:         null,
    estado:           'vigente' as const,
  }))

  // upsert on (empresa_id, tipo, numero) to avoid duplicates
  const { data, error } = await supabase
    .from('boletas_honorarios')
    .upsert(rows, { onConflict: 'empresa_id,tipo,numero', ignoreDuplicates: true })
    .select('id')

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })

  const imported = data?.length ?? rows.length
  const skipped  = rows.length - imported

  return NextResponse.json({ ok: true, imported, skipped })
}
