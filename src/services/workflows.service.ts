import { createClient } from '@/lib/supabase/server'
import type {
  WorkflowConfig,
  WorkflowPaso,
  WorkflowInstancia,
  ModuloWorkflow,
} from '@/types/workflows.types'

export async function getWorkflowConfigs(empresa_id: string): Promise<WorkflowConfig[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workflow_configs')
    .select(`*, pasos:workflow_pasos(*)`)
    .eq('empresa_id', empresa_id)
    .eq('is_active', true)
    .order('modulo')
    .order('nombre')

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as WorkflowConfig[]
}

export async function createWorkflowConfig(
  empresa_id: string,
  modulo: ModuloWorkflow,
  nombre: string,
  descripcion: string | null,
  monto_min: number | null,
  monto_max: number | null,
  pasos: Array<{ nombre: string; orden: number; rol_requerido: string | null }>
): Promise<WorkflowConfig> {
  const supabase = await createClient()

  const { data: config, error } = await supabase
    .from('workflow_configs')
    .insert({ empresa_id, modulo, nombre, descripcion, monto_min, monto_max, is_active: true })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (pasos.length) {
    const pasosInsert = pasos.map((p) => ({
      workflow_id: config.id,
      ...p,
      user_id: null,
      es_paralelo: false,
    }))
    const { error: pasosErr } = await supabase.from('workflow_pasos').insert(pasosInsert)
    if (pasosErr) throw new Error(pasosErr.message)
  }

  return config as WorkflowConfig
}

export async function getInstancias(empresa_id: string, estado?: string): Promise<WorkflowInstancia[]> {
  const supabase = await createClient()
  let query = supabase
    .from('workflow_instancias')
    .select(`*, workflow:workflow_configs(nombre, modulo), decisiones:workflow_decisiones(*)`)
    .eq('empresa_id', empresa_id)
    .order('creado_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as WorkflowInstancia[]
}

export async function iniciarWorkflow(
  empresa_id: string,
  workflow_id: string,
  referencia_tabla: string,
  referencia_id: string
): Promise<WorkflowInstancia> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('workflow_instancias')
    .insert({
      empresa_id,
      workflow_id,
      referencia_tabla,
      referencia_id,
      estado: 'en_proceso',
      paso_actual: 1,
      iniciado_por: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as WorkflowInstancia
}

export async function registrarDecision(
  instancia_id: string,
  paso_id: string,
  decision: 'aprobado' | 'rechazado',
  comentario: string | null
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error: decErr } = await supabase
    .from('workflow_decisiones')
    .insert({ instancia_id, paso_id, user_id: user?.id ?? null, decision, comentario })

  if (decErr) throw new Error(decErr.message)

  const nuevoEstado = decision === 'rechazado' ? 'rechazado' : 'aprobado'
  const { error: updErr } = await supabase
    .from('workflow_instancias')
    .update({
      estado: nuevoEstado,
      completado_at: new Date().toISOString(),
    })
    .eq('id', instancia_id)

  if (updErr) throw new Error(updErr.message)
}
