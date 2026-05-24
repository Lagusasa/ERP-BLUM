'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, cn } from '@/lib/utils'
import type { WorkflowInstancia, WorkflowConfig, EstadoInstancia } from '@/types/workflows.types'
import { ESTADO_INSTANCIA_LABELS, MODULO_WORKFLOW_LABELS } from '@/types/workflows.types'

interface Props {
  instancias: WorkflowInstancia[]
  configs: WorkflowConfig[]
  empresa_id: string
  filtroEstado?: string
}

function EstadoBadge({ estado }: { estado: EstadoInstancia }) {
  const map: Record<EstadoInstancia, string> = {
    pendiente:  'bg-slate-100 text-slate-600',
    en_proceso: 'bg-emerald-100 text-emerald-800',
    aprobado:   'bg-green-100 text-green-700',
    rechazado:  'bg-red-100 text-red-700',
    cancelado:  'bg-slate-100 text-slate-400',
  }
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', map[estado])}>
      {ESTADO_INSTANCIA_LABELS[estado]}
    </span>
  )
}

interface DecisionModalProps {
  instancia: WorkflowInstancia
  onClose: () => void
  onDone: () => void
}

function DecisionModal({ instancia, onClose, onDone }: DecisionModalProps) {
  const [decision, setDecision] = useState<'aprobado' | 'rechazado'>('aprobado')
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pasos = instancia.workflow ? [] : []
  const paso_id = (instancia as unknown as { decisiones?: Array<{ paso_id: string }> }).decisiones?.[0]?.paso_id ?? ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/workflows', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instancia_id: instancia.id,
        paso_id: paso_id || instancia.id,
        decision,
        comentario: comentario.trim() || null,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.ok) { setError(json.error ?? 'Error'); return }
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Registrar decisión</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <p className="text-sm text-slate-500">
          Flujo: <strong>{instancia.workflow?.nombre ?? '—'}</strong>
          {' · '} Paso {instancia.paso_actual}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <button type="button"
              onClick={() => setDecision('aprobado')}
              className={cn(
                'flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors',
                decision === 'aprobado'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-slate-200 text-slate-500 hover:border-green-300'
              )}>
              ✓ Aprobar
            </button>
            <button type="button"
              onClick={() => setDecision('rechazado')}
              className={cn(
                'flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors',
                decision === 'rechazado'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 text-slate-500 hover:border-red-300'
              )}>
              ✕ Rechazar
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Comentario {decision === 'rechazado' ? '(requerido)' : '(opcional)'}
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              required={decision === 'rechazado'}
              rows={3}
              placeholder="Motivo o notas de la decisión…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className={cn(
                'px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50',
                decision === 'aprobado' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              )}>
              {loading ? 'Guardando…' : decision === 'aprobado' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function WorkflowsClient({ instancias, configs, empresa_id, filtroEstado }: Props) {
  const router = useRouter()
  const [decidiendo, setDecidiendo] = useState<WorkflowInstancia | null>(null)
  const [desactivando, setDesactivando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function desactivarConfig(id: string) {
    if (!confirm('¿Desactivar este flujo? Las instancias existentes no se verán afectadas.')) return
    setDesactivando(id)
    const res = await fetch('/api/workflows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, empresa_id }),
    })
    setDesactivando(null)
    const json = await res.json()
    if (!json.ok) setError(json.error ?? 'Error')
    else router.refresh()
  }

  const pendientes = instancias.filter((i) => i.estado === 'en_proceso').length
  const aprobados  = instancias.filter((i) => i.estado === 'aprobado').length
  const rechazados = instancias.filter((i) => i.estado === 'rechazado').length

  const ESTADOS = ['', 'en_proceso', 'aprobado', 'rechazado'] as const

  return (
    <>
      {decidiendo && (
        <DecisionModal
          instancia={decidiendo}
          onClose={() => setDecidiendo(null)}
          onDone={() => { setDecidiendo(null); router.refresh() }}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Workflows y Aprobaciones</h1>
            <p className="text-sm text-slate-500 mt-0.5">Gestión de flujos de aprobación para documentos y operaciones.</p>
          </div>
          <Link
            href="/workflows/nuevo"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo flujo
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{instancias.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">En proceso</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{pendientes}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Aprobados</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{aprobados}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Rechazados</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{rechazados}</p>
          </div>
        </div>

        {/* Flujos configurados */}
        {configs.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Flujos configurados</h2>
              <span className="text-xs text-slate-400">{configs.length} activo{configs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {configs.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{c.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {MODULO_WORKFLOW_LABELS[c.modulo]} · {c.pasos?.length ?? 0} paso{(c.pasos?.length ?? 0) !== 1 ? 's' : ''}
                      {c.monto_min != null && ` · desde $${c.monto_min.toLocaleString('es-CL')}`}
                    </p>
                  </div>
                  <button
                    onClick={() => desactivarConfig(c.id)}
                    disabled={desactivando === c.id}
                    className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    {desactivando === c.id ? '…' : 'Desactivar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instancias */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Solicitudes de aprobación</h2>
            <div className="flex gap-2">
              {ESTADOS.map((e) => (
                <Link
                  key={e}
                  href={e ? `?estado=${e}` : '/workflows'}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md font-medium transition-colors',
                    filtroEstado === e || (!filtroEstado && !e)
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {e ? ESTADO_INSTANCIA_LABELS[e as EstadoInstancia] : 'Todos'}
                </Link>
              ))}
            </div>
          </div>
          {instancias.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              {configs.length === 0
                ? 'Configura un flujo de aprobación para comenzar.'
                : 'No hay solicitudes de aprobación.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Flujo</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Referencia</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Paso</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Iniciado</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instancias.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{i.workflow?.nombre ?? '—'}</p>
                      <p className="text-xs text-slate-400">
                        {i.workflow ? MODULO_WORKFLOW_LABELS[i.workflow.modulo] : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {i.referencia_tabla} / {i.referencia_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">Paso {i.paso_actual}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(i.creado_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <EstadoBadge estado={i.estado as EstadoInstancia} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {i.estado === 'en_proceso' && (
                        <button
                          onClick={() => setDecidiendo(i)}
                          className="text-xs px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium border border-emerald-200 transition-colors"
                        >
                          Decidir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
