import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWorkflowConfig, registrarDecision } from '@/services/workflows.service'
import type { ModuloWorkflow } from '@/types/workflows.types'

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { id, empresa_id } = await req.json()
  if (!id || !empresa_id) return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })

  const { error } = await supabase
    .from('workflow_configs')
    .update({ is_active: false })
    .eq('id', id)
    .eq('empresa_id', empresa_id)

  if (error) return NextResponse.json({ ok: false, error: error.message })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { empresa_id, modulo, nombre, descripcion, monto_min, monto_max, pasos } = await req.json()
  if (!empresa_id || !modulo || !nombre) {
    return NextResponse.json({ ok: false, error: 'empresa_id, modulo y nombre son requeridos' }, { status: 400 })
  }

  try {
    const config = await createWorkflowConfig(
      empresa_id, modulo as ModuloWorkflow, nombre, descripcion ?? null,
      monto_min ?? null, monto_max ?? null, pasos ?? []
    )
    return NextResponse.json({ ok: true, config })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const { instancia_id, paso_id, decision, comentario } = await req.json()
  if (!instancia_id || !paso_id || !decision) {
    return NextResponse.json({ ok: false, error: 'Parámetros inválidos' }, { status: 400 })
  }

  try {
    await registrarDecision(instancia_id, paso_id, decision, comentario ?? null)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}
