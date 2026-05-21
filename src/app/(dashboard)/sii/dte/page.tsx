import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDteDocumentos } from '@/services/sii.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TIPO_DTE_LABELS, ESTADO_DTE_LABELS } from '@/types/sii.types'

export const metadata: Metadata = { title: 'DTE — Documentos Tributarios' }

export default async function DtePage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const dtes = await getDteDocumentos(empresa.id)

  const totalNeto  = dtes.reduce((s, d) => s + d.monto_neto, 0)
  const totalIva   = dtes.reduce((s, d) => s + d.monto_iva, 0)
  const totalTotal = dtes.reduce((s, d) => s + d.monto_total, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Documentos Tributarios Electrónicos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registro de DTEs emitidos y recibidos.</p>
        </div>
        <Link href="/sii/dte/nuevo"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo DTE
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Neto total</p>
          <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(totalNeto)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">IVA total</p>
          <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(totalIva)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total bruto</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{formatCurrency(totalTotal)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {dtes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">Sin documentos registrados.</p>
            <Link href="/sii/dte/nuevo" className="mt-2 inline-block text-sm text-emerald-700 hover:underline">
              Registrar primer DTE →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Folio</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Contraparte</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Neto</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dtes.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-xs font-medium text-slate-700">{TIPO_DTE_LABELS[d.tipo_dte] ?? d.tipo_dte}</td>
                  <td className="px-4 py-2.5 text-slate-600">#{d.folio}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-slate-800 text-xs leading-tight">{d.razon_social ?? '—'}</p>
                    <p className="text-slate-400 text-xs">{d.rut_contraparte}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(d.fecha_emision)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      d.estado === 'aceptado' ? 'bg-green-100 text-green-700' :
                      d.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                      d.estado === 'anulado' ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-100 text-amber-700'
                    }`}>{ESTADO_DTE_LABELS[d.estado] ?? d.estado}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 text-xs">{formatCurrency(d.monto_neto)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 text-xs">{formatCurrency(d.monto_iva)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-800">{formatCurrency(d.monto_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
