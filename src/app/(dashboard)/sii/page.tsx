import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDteDocumentos, getBoletasHonorarios, getSiiConfig } from '@/services/sii.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TIPO_DTE_LABELS, ESTADO_DTE_LABELS } from '@/types/sii.types'

export const metadata: Metadata = { title: 'Integraciones SII' }

export default async function SiiPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [dtes, boletas, config] = await Promise.all([
    getDteDocumentos(empresa.id),
    getBoletasHonorarios(empresa.id),
    getSiiConfig(empresa.id),
  ])

  const totalDteFacturas  = dtes.filter((d) => d.tipo_dte === '33').length
  const totalBoletasEmit  = boletas.filter((b) => b.tipo === 'emitida' && b.estado === 'vigente').length
  const totalBoletasRec   = boletas.filter((b) => b.tipo === 'recibida' && b.estado === 'vigente').length
  const totalRetenciones  = boletas.filter((b) => b.tipo === 'recibida' && b.estado === 'vigente')
    .reduce((s, b) => s + b.retencion_10, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Integraciones SII</h1>
          <p className="text-sm text-slate-500 mt-0.5">DTE, honorarios y declaración de renta.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/sii/config"
            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Configuración
          </Link>
          <Link href="/sii/dte/nuevo"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
            + DTE
          </Link>
        </div>
      </div>

      {/* Config warning */}
      {!config && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Configura los datos del SII antes de emitir DTEs. <Link href="/sii/config" className="underline font-medium">Ir a configuración →</Link></span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Facturas emitidas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalDteFacturas}</p>
          <p className="text-xs text-slate-400 mt-0.5">Tipo 33</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Boletas HH emitidas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalBoletasEmit}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Boletas HH recibidas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalBoletasRec}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Retenciones acum.</p>
          <p className="text-2xl font-bold text-orange-600 mt-1 tabular-nums">{formatCurrency(totalRetenciones)}</p>
        </div>
      </div>

      {/* Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/sii/dte"
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 group-hover:text-blue-700">DTE</p>
          </div>
          <p className="text-sm text-slate-500">Facturas, boletas y notas de crédito/débito electrónicas.</p>
          <p className="text-xs text-slate-400 mt-2">{dtes.length} documentos registrados</p>
        </Link>

        <Link href="/sii/honorarios"
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-green-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 group-hover:text-green-700">Honorarios</p>
          </div>
          <p className="text-sm text-slate-500">Boletas de honorarios emitidas y recibidas con retención 10%.</p>
          <p className="text-xs text-slate-400 mt-2">{boletas.length} boletas registradas</p>
        </Link>

        <Link href="/sii/f22"
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 group-hover:text-purple-700">F22 Renta</p>
          </div>
          <p className="text-sm text-slate-500">Declaración de Impuesto a la Renta anual (Formulario 22).</p>
          <p className="text-xs text-slate-400 mt-2">Año tributario {new Date().getFullYear()}</p>
        </Link>
      </div>

      {/* Últimos DTEs */}
      {dtes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Últimos DTE</h2>
            <Link href="/sii/dte" className="text-xs text-blue-600 hover:underline">Ver todos →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Folio</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Contraparte</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dtes.slice(0, 10).map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-xs font-medium text-slate-700">{TIPO_DTE_LABELS[d.tipo_dte] ?? d.tipo_dte}</td>
                  <td className="px-4 py-2.5 text-slate-600">#{d.folio}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-slate-800 text-xs">{d.razon_social ?? '—'}</p>
                    <p className="text-slate-400 text-xs">{d.rut_contraparte}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(d.fecha_emision)}</td>
                  <td className="px-4 py-2.5">
                    <EstadoBadge estado={d.estado} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-800">
                    {formatCurrency(d.monto_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700',
    aceptado:  'bg-green-100 text-green-700',
    rechazado: 'bg-red-100 text-red-700',
    anulado:   'bg-slate-100 text-slate-500',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colors[estado] ?? 'bg-slate-100 text-slate-600'}`}>
      {ESTADO_DTE_LABELS[estado as keyof typeof ESTADO_DTE_LABELS] ?? estado}
    </span>
  )
}
