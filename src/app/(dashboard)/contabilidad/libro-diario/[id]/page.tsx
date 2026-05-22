import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEmpresaActiva } from '@/lib/empresa'
import { getComprobante } from '@/services/contabilidad.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  TIPO_COMPROBANTE_LABELS,
  ESTADO_COMPROBANTE_LABELS,
} from '@/types/contabilidad.types'
import ComprobanteDetalleClient from '@/components/contabilidad/ComprobanteDetalleClient'

export const metadata: Metadata = { title: 'Detalle Comprobante' }

export default async function ComprobanteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const comp = await getComprobante(id, empresa.id)
  if (!comp) notFound()

  const lineas = comp.lineas ?? []
  const totalDebe = lineas.reduce((s, l) => s + l.debe, 0)
  const totalHaber = lineas.reduce((s, l) => s + l.haber, 0)
  const balanceado = Math.abs(totalDebe - totalHaber) < 0.01

  const estadoColor: Record<string, string> = {
    aprobado: 'bg-green-100 text-green-700 border-green-200',
    borrador: 'bg-amber-100 text-amber-700 border-amber-200',
    anulado:  'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/contabilidad/libro-diario" className="hover:text-emerald-700 transition-colors">
          Libro Diario
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Comprobante #{comp.numero}</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                Comprobante #{comp.numero}
              </h1>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoColor[comp.estado] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {ESTADO_COMPROBANTE_LABELS[comp.estado as keyof typeof ESTADO_COMPROBANTE_LABELS] ?? comp.estado}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {TIPO_COMPROBANTE_LABELS[comp.tipo]} — {formatDate(comp.fecha)}
            </p>
            {comp.glosa && (
              <p className="text-sm text-slate-700 font-medium">{comp.glosa}</p>
            )}
            {comp.referencia && (
              <p className="text-xs text-slate-400">Ref: {comp.referencia}</p>
            )}
          </div>

          <div className="text-right space-y-1 shrink-0">
            <p className="text-xs text-slate-400">Período</p>
            <p className="text-sm font-medium text-slate-700">
              {comp.periodo ? `${comp.periodo.mes}/${comp.periodo.anio}` : '—'}
            </p>
            {comp.aprobado_at && (
              <p className="text-xs text-slate-400">
                Aprobado {formatDate(comp.aprobado_at)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de líneas */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">Partidas contables</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500 w-8">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-28">Código</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Cuenta</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 hidden md:table-cell">Glosa línea</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 w-32">Debe</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500 w-32">Haber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                  Este comprobante no tiene líneas registradas.
                </td>
              </tr>
            ) : (
              lineas
                .sort((a, b) => a.orden - b.orden)
                .map((l, i) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-emerald-700 font-semibold">
                      {l.cuenta?.codigo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{l.cuenta?.nombre ?? '—'}</p>
                      <p className="text-xs text-slate-400 capitalize">{l.cuenta?.clase ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                      {l.glosa ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {l.debe > 0 ? (
                        <span className="text-slate-800 font-medium">{formatCurrency(l.debe)}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {l.haber > 0 ? (
                        <span className="text-slate-800 font-medium">{formatCurrency(l.haber)}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50">
            <tr>
              <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-slate-600 text-right hidden md:table-cell">
                Totales ({lineas.length} líneas)
              </td>
              <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-slate-600 text-right md:hidden">
                Totales
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">
                {formatCurrency(totalDebe)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-800">
                {formatCurrency(totalHaber)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="px-5 py-2 text-right text-xs hidden md:table-cell" />
              <td colSpan={2} className="px-5 py-2 text-right md:hidden" />
              <td colSpan={2} className="px-5 py-2 text-right">
                {balanceado ? (
                  <span className="text-xs text-green-600 font-semibold">Balanceado</span>
                ) : (
                  <span className="text-xs text-red-600 font-semibold">
                    Diferencia: {formatCurrency(Math.abs(totalDebe - totalHaber))}
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Acciones */}
      <ComprobanteDetalleClient
        comprobante_id={comp.id}
        empresa_id={empresa.id}
        estado={comp.estado}
        numero={comp.numero}
      />
    </div>
  )
}
