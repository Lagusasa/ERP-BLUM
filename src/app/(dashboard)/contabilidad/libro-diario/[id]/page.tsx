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

  const lineas = (comp.lineas ?? []).sort((a, b) => a.orden - b.orden)
  const totalDebe  = lineas.reduce((s, l) => s + l.debe, 0)
  const totalHaber = lineas.reduce((s, l) => s + l.haber, 0)
  const balanceado = Math.abs(totalDebe - totalHaber) < 0.01

  const estadoColor: Record<string, string> = {
    aprobado: 'bg-green-100 text-green-700 border-green-200',
    borrador: 'bg-amber-100 text-amber-700 border-amber-200',
    anulado:  'bg-red-100 text-red-700 border-red-200',
  }

  const mesAnio = comp.periodo
    ? `${String(comp.periodo.mes).padStart(2, '0')}/${comp.periodo.anio}`
    : '—'

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── ENCABEZADO SOLO EN IMPRESIÓN ── */}
      <div className="hidden print:block mb-2">
        <div className="flex items-start justify-between pb-3 border-b-2 border-black">
          <div>
            <p className="text-[11pt] font-bold uppercase tracking-wide">{empresa.razon_social}</p>
            <p className="text-[9pt] text-gray-600">RUT: {empresa.rut}</p>
          </div>
          <div className="text-right">
            <p className="text-[9pt] text-gray-500">ERP SaaS Chile</p>
            <p className="text-[9pt] text-gray-500">Impreso: {new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        <div className="mt-3 text-center">
          <h1 className="text-[14pt] font-bold uppercase tracking-widest">Comprobante Contable</h1>
          <p className="text-[11pt] font-semibold">N° {comp.numero}</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-x-6 gap-y-1 text-[9pt]">
          <div><span className="font-semibold">Tipo:</span> {TIPO_COMPROBANTE_LABELS[comp.tipo]}</div>
          <div><span className="font-semibold">Fecha:</span> {formatDate(comp.fecha)}</div>
          <div><span className="font-semibold">Período:</span> {mesAnio}</div>
          <div><span className="font-semibold">Estado:</span> {ESTADO_COMPROBANTE_LABELS[comp.estado as keyof typeof ESTADO_COMPROBANTE_LABELS]}</div>
          {comp.aprobado_at && (
            <div><span className="font-semibold">Aprobado:</span> {formatDate(comp.aprobado_at)}</div>
          )}
          {comp.referencia && (
            <div><span className="font-semibold">Referencia:</span> {comp.referencia}</div>
          )}
        </div>

        {comp.glosa && (
          <div className="mt-2 text-[9pt]">
            <span className="font-semibold">Glosa:</span> {comp.glosa}
          </div>
        )}

        <div className="mt-3 border-t border-gray-400" />
      </div>

      {/* ── BREADCRUMB (oculto en impresión) ── */}
      <div className="flex items-center gap-2 text-sm text-slate-500 print:hidden">
        <Link href="/contabilidad/libro-diario" className="hover:text-emerald-700 transition-colors">
          Libro Diario
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Comprobante #{comp.numero}</span>
      </div>

      {/* ── ENCABEZADO EN PANTALLA ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 print:hidden">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Comprobante #{comp.numero}</h1>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoColor[comp.estado] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {ESTADO_COMPROBANTE_LABELS[comp.estado as keyof typeof ESTADO_COMPROBANTE_LABELS] ?? comp.estado}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {TIPO_COMPROBANTE_LABELS[comp.tipo]} — {formatDate(comp.fecha)}
            </p>
            {comp.glosa && <p className="text-sm text-slate-700 font-medium">{comp.glosa}</p>}
            {comp.referencia && <p className="text-xs text-slate-400">Ref: {comp.referencia}</p>}
          </div>
          <div className="text-right space-y-1 shrink-0">
            <p className="text-xs text-slate-400">Período</p>
            <p className="text-sm font-medium text-slate-700">{mesAnio}</p>
            {comp.aprobado_at && (
              <p className="text-xs text-slate-400">Aprobado {formatDate(comp.aprobado_at)}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── TABLA DE PARTIDAS ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden print:border-0 print:rounded-none">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
          <h2 className="text-sm font-semibold text-slate-700">Partidas contables</h2>
        </div>

        {/* Título de partidas solo en impresión */}
        <p className="hidden print:block text-[10pt] font-bold mb-1 mt-1">Partidas contables</p>

        <table className="w-full text-sm print:text-[9pt]">
          <thead className="border-b border-slate-200 print:border-b print:border-black">
            <tr className="bg-slate-50 print:bg-white">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500 w-8 print:px-1 print:py-1.5">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-28 print:px-2 print:py-1.5">Código</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 print:px-2 print:py-1.5">Cuenta</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 print:px-2 print:py-1.5">Glosa</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 w-32 print:px-2 print:py-1.5">Debe</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-500 w-32 print:px-1 print:py-1.5">Haber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-gray-200">
            {lineas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                  Este comprobante no tiene líneas registradas.
                </td>
              </tr>
            ) : (
              lineas.map((l, i) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors print:hover:bg-white">
                  <td className="px-5 py-3 text-xs text-slate-400 print:px-1 print:py-1">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-emerald-700 font-semibold print:px-2 print:py-1 print:text-black">
                    {l.cuenta?.codigo ?? '—'}
                  </td>
                  <td className="px-4 py-3 print:px-2 print:py-1">
                    <p className="font-medium text-slate-800 print:text-black">{l.cuenta?.nombre ?? '—'}</p>
                    <p className="text-xs text-slate-400 capitalize print:hidden">{l.cuenta?.clase ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 print:px-2 print:py-1 print:text-black">
                    {l.glosa ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums print:px-2 print:py-1">
                    {l.debe > 0
                      ? <span className="text-slate-800 font-medium print:text-black">{formatCurrency(l.debe)}</span>
                      : <span className="text-slate-300 print:text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums print:px-1 print:py-1">
                    {l.haber > 0
                      ? <span className="text-slate-800 font-medium print:text-black">{formatCurrency(l.haber)}</span>
                      : <span className="text-slate-300 print:text-gray-400">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50 print:border-t-2 print:border-black print:bg-white">
            <tr>
              <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-slate-600 text-right print:px-2 print:py-1.5 print:text-black">
                Totales ({lineas.length} líneas)
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800 print:px-2 print:py-1.5 print:text-black">
                {formatCurrency(totalDebe)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-800 print:px-1 print:py-1.5 print:text-black">
                {formatCurrency(totalHaber)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="px-5 py-1 print:px-2 print:py-0.5" />
              <td colSpan={2} className="px-5 py-1 text-right print:px-1 print:py-0.5">
                {balanceado
                  ? <span className="text-xs text-green-600 font-semibold print:text-black">✓ Balanceado</span>
                  : <span className="text-xs text-red-600 font-semibold print:text-red-700">
                      ✗ Diferencia: {formatCurrency(Math.abs(totalDebe - totalHaber))}
                    </span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── SECCIÓN DE FIRMAS SOLO EN IMPRESIÓN ── */}
      <div className="hidden print:block mt-10">
        <div className="border-t border-gray-300 pt-1 mb-8" />
        <div className="grid grid-cols-3 gap-8 text-[9pt]">
          <div className="text-center">
            <div className="border-b border-black mb-1 pb-6" />
            <p className="font-semibold">Preparado por</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-1 pb-6" />
            <p className="font-semibold">Revisado por</p>
          </div>
          <div className="text-center">
            <div className="border-b border-black mb-1 pb-6" />
            <p className="font-semibold">Aprobado por</p>
          </div>
        </div>
        <div className="mt-8 text-center text-[8pt] text-gray-400">
          Generado por ERP SaaS Chile — Comprobante N° {comp.numero} — {empresa.razon_social} ({empresa.rut})
        </div>
      </div>

      {/* ── ACCIONES EN PANTALLA ── */}
      <ComprobanteDetalleClient
        comprobante_id={comp.id}
        empresa_id={empresa.id}
        estado={comp.estado}
        numero={comp.numero}
      />
    </div>
  )
}
