import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TipoCuenta } from '@/types/finanzas.types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, banco, tipo_cuenta, numero_cuenta, moneda, saldo_inicial } = body as {
    empresa_id: string
    banco: string
    tipo_cuenta: TipoCuenta
    numero_cuenta: string
    moneda: string
    saldo_inicial: number
  }

  if (!empresa_id || !banco || !tipo_cuenta || !numero_cuenta || !moneda) {
    return NextResponse.json({ ok: false, error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .insert({
      empresa_id,
      banco,
      tipo_cuenta,
      numero_cuenta,
      moneda,
      saldo_inicial: saldo_inicial ?? 0,
      saldo_actual:  saldo_inicial ?? 0,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, data })
}
