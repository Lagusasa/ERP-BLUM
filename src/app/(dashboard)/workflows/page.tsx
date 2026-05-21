import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getInstancias, getWorkflowConfigs } from '@/services/workflows.service'
import { formatDate, cn } from '@/lib/utils'
import { ESTADO_INSTANCIA_LABELS, MODULO_WORKFLOW_LABELS } from '@/types/workflows.types'
import type { EstadoInstancia } from '@/types/workflows.types'

export const metadata: Metadata = { title: 'Workflows' }

interface Props {
  searchParams: Promise<{ estado?: string }>
}

function EstadoBadge({ estado }: { estado: EstadoInstancia }) {
  const map: Record<EstadoInstancia, string> = {
    pendiente:   'bg-slate-100 text-slate-600',
    en_proceso:  'bg-emerald-100 text-emerald-800',
    aprobado:    'bg-green-100 text-green-700',
    rechazado:   'bg-red-100 text-red-700',
    cancelado:   'bg-slate-100 text-slate-400',
  }
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', map[estado])}>
      {ESTADO_INSTANCIA_LABELS[estado]}
    </span>
  )
}

export default async function WorkflowsPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const [instancias, configs] = await Promise.all([
    getInstancias(empresa.id, params.estado),
    getWorkflowConfigs(empresa.id),
  ])

  const pendientes = instancias.filter((i) => i.estado === 'en_proceso').length
  const aprobados  = instancias.filter((i) => i.estado === 'aprobado').length
  const rechazados = instancias.filter((i) => i.estado === 'rechazado').length

  return (
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
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Flujos configurados</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {configs.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{c.nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {MODULO_WORKFLOW_LABELS[c.modulo]} · {c.pasos?.length ?? 0} paso{(c.pasos?.length ?? 0) !== 1 ? 's' : ''}
                    {c.monto_min != null && ` · desde ${c.monto_min.toLocaleString('es-CL')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instancias recientes */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Solicitudes de aprobación</h2>
          <div className="flex gap-2">
            {(['', 'en_proceso', 'aprobado', 'rechazado'] as const).map((e) => (
              <Link
                key={e}
                href={e ? `?estado=${e}` : '/workflows'}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-md font-medium transition-colors',
                  params.estado === e || (!params.estado && !e)
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
