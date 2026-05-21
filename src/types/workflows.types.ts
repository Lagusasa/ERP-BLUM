export type ModuloWorkflow = 'compras' | 'ventas' | 'pagos' | 'otros'
export type EstadoInstancia = 'pendiente' | 'en_proceso' | 'aprobado' | 'rechazado' | 'cancelado'
export type DecisionWorkflow = 'aprobado' | 'rechazado'

export const MODULO_WORKFLOW_LABELS: Record<ModuloWorkflow, string> = {
  compras: 'Compras',
  ventas: 'Ventas',
  pagos: 'Pagos',
  otros: 'Otros',
}

export const ESTADO_INSTANCIA_LABELS: Record<EstadoInstancia, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
}

export interface WorkflowConfig {
  id: string
  empresa_id: string
  modulo: ModuloWorkflow
  nombre: string
  descripcion: string | null
  monto_min: number | null
  monto_max: number | null
  is_active: boolean
  pasos?: WorkflowPaso[]
}

export interface WorkflowPaso {
  id: string
  workflow_id: string
  orden: number
  nombre: string
  rol_requerido: string | null
  user_id: string | null
  es_paralelo: boolean
}

export interface WorkflowInstancia {
  id: string
  empresa_id: string
  workflow_id: string
  referencia_tabla: string
  referencia_id: string
  estado: EstadoInstancia
  paso_actual: number
  iniciado_por: string | null
  creado_at: string
  completado_at: string | null
  workflow?: Pick<WorkflowConfig, 'nombre' | 'modulo'>
  decisiones?: WorkflowDecision[]
}

export interface WorkflowDecision {
  id: string
  instancia_id: string
  paso_id: string
  user_id: string | null
  decision: DecisionWorkflow
  comentario: string | null
  created_at: string
}
