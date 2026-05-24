'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentoVenta } from '@/types/compras.types'
import { ESTADO_VENTA_LABELS } from '@/types/compras.types'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

interface Props {
  documentos: DocumentoVenta[]
  empresa_id: string
}

function diasVencimiento(fechaVenc: string | null, estado: string): number | null {
  if (!fechaVenc || estado === 'cobrado' || estado === 'anulado') return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fechaVenc); venc.setHours(0, 0, 0, 0)
  return Math.round((hoy.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24))
}

function VencimientoBadge({ dias }: { dias: number | null }) {
  if (dias === null) return null
  if (dias < 0) {
    const faltan = -dias
    const color = faltan <= 7 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-500 bg-slate-50 border-slate-200'
    return <span className={`inline-block text-xs px-1.5 py-0.5 rounded border ${color}`}>vence en {faltan}d</span>
  }
  if (dias === 0) return <span className="inline-block text-xs px-1.5 py-0.5 rounded border text-amber-700 bg-amber-50 border-amber-200">vence hoy</span>
  return <span className="inline-block text-xs px-1.5 py-0.5 rounded border text-red-700 bg-red-50 border-red-200">{dias}d vencido</span>
}

export default function DocumentosVentaClient({ documentos, empresa_id }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [procesando, setProcesando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const termino = busqueda.toLowerCase()
    return documentos.filter((d) => {
      const coincide =
        !busqueda ||
        (d.cliente?.razon_social ?? '').toLowerCase().includes(termino) ||
        d.numero_documento.includes(termino) ||
        (d.cliente?.rut ?? '').includes(termino)
      const estadoOk = filtroEstado === 'todos' || d.estado === filtroEstado
      return coincide && estadoOk
    })
  }, [documentos, busqueda, filtroEstado])

  const totalNeto  = filtrados.reduce((s, d) => s + d.neto, 0)
  const totalIVA   = filtrados.reduce((s, d) => s + d.iva, 0)
  const totalBruto = filtrados.reduce((s, d) => s + d.total, 0)

  async function contabilizar(doc_id: string) {
    setProcesando(doc_id); setError(null)
    try {
      const res = await fetch('/api/centralizacion/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id, doc_id }),
      })
      const json = await res.json()
      if (!json.ok) { setError(json.error ?? 'Error al contabilizar'); return }
      router.refresh()
    } catch { setError('Error de conexión') } finally { setProcesando(null) }
  }

  async function marcarCobrado(doc_id: string) {
    if (!confirm('¿Confirmar cobro de este documento?')) return
    setProcesando(doc_id); setError(null)
    try {
      const res = await fetch('/api/ventas/documentos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc_id, accion: 'cobrado' }),
      })
      const json = await res.json()
      if (!json.ok) { setError(json.error ?? 'Error'); return }
      router.refresh()
    } catch { setError('Error de conexión') } finally { setProcesando(null) }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span className="shrink-0">⚠</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar cliente, N° documento..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="todos">Todos los estados</option>
            {Object.entries(ESTADO_VENTA_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Cliente</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Documento</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Emisión / Vencimiento</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Neto</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">No hay documentos que coincidan.</td></tr>
              ) : (
                filtrados.map((d) => {
                  const dias = diasVencimiento(d.fecha_vencimiento, d.estado)
                  return (
                    <tr key={d.id} className={cn('hover:bg-slate-50 transition-colors', {
                      'bg-red-50/30': dias !== null && dias > 0,
                    })}>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-slate-800">{d.cliente?.razon_social ?? '—'}</p>
                        <p className="text-xs text-slate-400">{d.cliente?.rut}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        <p className="font-medium">{d.tipo_documento?.abreviatura} N° {d.numero_documento}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        <p>{formatDate(d.fecha_emision)}</p>
                        {d.fecha_vencimiento && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-slate-400">{formatDate(d.fecha_vencimiento)}</span>
                            <VencimientoBadge dias={dias} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.neto)}</td>
                      <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.iva)}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums">{formatCurrency(d.total)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', {
                          'bg-emerald-100 text-emerald-800':  d.estado === 'emitido',
                          'bg-indigo-100 text-indigo-700':    d.estado === 'contabilizado',
                          'bg-green-100 text-green-700':      d.estado === 'cobrado',
                          'bg-red-100 text-red-700':          d.estado === 'anulado',
                        })}>
                          {ESTADO_VENTA_LABELS[d.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {d.estado === 'emitido' && (
                            <button onClick={() => contabilizar(d.id)} disabled={procesando === d.id}
                              className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium disabled:opacity-50 transition-colors whitespace-nowrap">
                              {procesando === d.id ? '...' : 'Centralizar'}
                            </button>
                          )}
                          {(d.estado === 'contabilizado' || d.estado === 'emitido') && (
                            <button onClick={() => marcarCobrado(d.id)} disabled={procesando === d.id}
                              className="text-xs px-2.5 py-1 rounded-md bg-green-50 hover:bg-green-100 text-green-700 font-medium disabled:opacity-50 transition-colors whitespace-nowrap">
                              {procesando === d.id ? '...' : 'Cobrado'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {filtrados.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-slate-600 text-right">Totales ({filtrados.length}):</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalNeto)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalIVA)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalBruto)}</td>
                  <td /><td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
