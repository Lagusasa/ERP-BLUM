import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getComprobantes, getPeriodoActual, tieneMigracionTemplate } from '@/services/contabilidad.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TIPO_COMPROBANTE_LABELS, ESTADO_COMPROBANTE_LABELS } from '@/types/contabilidad.types'

export const metadata: Metadata = { title: 'Contabilidad' }

export default async function ContabilidadPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [comprobantes, periodoActual, tieneCuentas] = await Promise.allSettled([
    getComprobantes({ empresa_id: empresa.id }),
    getPeriodoActual(empresa.id),
    tieneMigracionTemplate(empresa.id),
  ])

  const listaComprobantes = comprobantes.status === 'fulfilled' ? comprobantes.value.slice(0, 10) : []
  const periodo = periodoActual.status === 'fulfilled' ? periodoActual.value : null
  const cuentasConfiguradas = tieneCuentas.status === 'fulfilled' ? tieneCuentas.value : false

  const totalAprobados = listaComprobantes.filter((c) => c.estado === 'aprobado').length
  const totalBorradores = listaComprobantes.filter((c) => c.estado === 'borrador').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contabilidad</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {periodo ? `Período activo: ${periodo.mes}/${periodo.anio}` : 'Sin período activo configurado'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/contabilidad/libro-diario/nuevo"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Comprobante
          </Link>
        </div>
      </div>

      {/* Alerta si no tiene plan de cuentas */}
      {!cuentasConfiguradas && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Plan de cuentas no configurado</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Esta empresa no tiene un plan de cuentas. Importa el plan de cuentas estándar chileno para comenzar.
            </p>
          </div>
          <Link
            href="/contabilidad/plan-cuentas"
            className="text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg whitespace-nowrap"
          >
            Configurar ahora →
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Comprobantes</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{listaComprobantes.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">últimos registros</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Aprobados</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalAprobados}</p>
          <p className="text-xs text-slate-400 mt-0.5">contabilizados</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Borradores</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalBorradores}</p>
          <p className="text-xs text-slate-400 mt-0.5">pendientes de aprobación</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Período actual</p>
          <p className="text-lg font-bold text-blue-600 mt-1">{periodo ? `${periodo.mes}/${periodo.anio}` : '—'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{periodo?.anio ?? 'No configurado'}</p>
        </div>
      </div>

      {/* Últimos comprobantes */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Últimos Comprobantes</h2>
          <Link href="/contabilidad/libro-diario" className="text-xs text-blue-600 hover:underline">
            Ver todos →
          </Link>
        </div>
        {listaComprobantes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No hay comprobantes registrados.</p>
            <Link
              href="/contabilidad/libro-diario/nuevo"
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
            >
              Crear primer comprobante
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">N°</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Glosa</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Debe</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Haber</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listaComprobantes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{c.numero}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.fecha)}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{c.glosa}</td>
                  <td className="px-4 py-3 text-slate-500">{TIPO_COMPROBANTE_LABELS[c.tipo]}</td>
                  <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(c.total_debe)}</td>
                  <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(c.total_haber)}</td>
                  <td className="px-4 py-3 text-center">
                    <EstadoBadge estado={c.estado} />
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

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    aprobado: 'bg-green-100 text-green-700',
    borrador: 'bg-amber-100 text-amber-700',
    anulado: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] ?? 'bg-slate-100 text-slate-600'}`}>
      {ESTADO_COMPROBANTE_LABELS[estado as keyof typeof ESTADO_COMPROBANTE_LABELS] ?? estado}
    </span>
  )
}
