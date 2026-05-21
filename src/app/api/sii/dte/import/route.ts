import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TipoDte, EstadoDte } from '@/types/sii.types'

interface DteImportRow {
  tipo_dte: string
  folio: number
  rut_contraparte: string
  razon_social: string
  fecha_emision: string
  monto_neto: number
  monto_iva: number
  monto_total: number
  estado: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, dtes } = body as { empresa_id: string; dtes: DteImportRow[] }

  if (!empresa_id || !Array.isArray(dtes) || dtes.length === 0) {
    return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 })
  }

  const VALID_TIPOS: TipoDte[] = ['33', '34', '39', '52', '61', '56']
  const VALID_ESTADOS: EstadoDte[] = ['pendiente', 'aceptado', 'rechazado', 'anulado']

  const rows = dtes.map((d) => ({
    empresa_id,
    tipo_dte:        (VALID_TIPOS.includes(d.tipo_dte as TipoDte) ? d.tipo_dte : '33') as TipoDte,
    folio:           Number(d.folio),
    rut_contraparte: String(d.rut_contraparte),
    razon_social:    d.razon_social || null,
    fecha_emision:   String(d.fecha_emision),
    monto_neto:      Number(d.monto_neto)  || 0,
    monto_iva:       Number(d.monto_iva)   || 0,
    monto_total:     Number(d.monto_total) || 0,
    estado:          (VALID_ESTADOS.includes(d.estado as EstadoDte) ? d.estado : 'pendiente') as EstadoDte,
    xml_raw:         null,
    track_id:        null,
    referencia_id:   null,
  }))

  // upsert on (empresa_id, tipo_dte, folio) to avoid duplicates
  const { data, error } = await supabase
    .from('dte_documentos')
    .upsert(rows, { onConflict: 'empresa_id,tipo_dte,folio', ignoreDuplicates: true })
    .select('id')

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })

  const imported = data?.length ?? rows.length
  const skipped  = rows.length - imported

  return NextResponse.json({ ok: true, imported, skipped })
}
