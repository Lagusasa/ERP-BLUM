'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { DocumentoVenta } from '@/types/compras.types'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

interface Props {
  documentos: DocumentoVenta[]
  empresa_id: string
}

function diasDesdeHoy(fecha: string): number {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha); f.setHours(0, 0, 0, 0)
  return Math.round((hoy.getTime() - f.getTime()) / (1000 * 60 * 60 * 24))
}

function tramo(dias: number): '0-30' | '31-60' | '61-90' | '+90' | 'vigente' {
  if (dias < 0) return 'vigente'
  if (dias <= 30) return '0-30'
  if (dias <= 60) return '31-60'
  if (dias <= 90) return '61-90'
  return '+90'
}

const TRAMO_STYLE: Record<string, string> = {
  vigente: 'text-slate-600 bg-slate-50 border-slate-200',
  '0-30':  'text-amber-700 bg-amber-50 border-amber-200',
  '31-60': 'text-orange-700 bg-orange-50 border-orange-200',
  '61-90': 'text-red-600 bg-red-50 border-red-200',
  '+90':   'text-red-900 bg-red-100 border-red-300',
}

export default function CxCClient({ documentos, empresa_id }: Props) {
  const router = useRouter()
  const [filtroCliente, setFiltroCliente] = useState('')
  const [procesando, setProcesando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pendientes = useMemo(() =>
    documentos.filter((d) => d.estado !== 'cobrado' && d.estado !== 'anulado'),
  [documentos])

  const clientes = useMemo(() => {
    const set = new Map<string, string>()
    pendientes.forEach((d) => {
      if (d.cliente_id && d.cliente?.razon_social) set.set(d.cliente_id, d.cliente.razon_social)
    })
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [pendientes])

  const filtrados = useMemo(() =>
    filtroCliente ? pendientes.filter((d) => d.cliente_id === filtroCliente) : pendientes,
  [pendientes, filtroCliente])

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const totalVencido = filtrados.filter((d) => d.fecha_vencimiento && new Date(d.fecha_vencimiento) < hoy).reduce((s, d) => s + d.total, 0)
  const totalProximoVencer = filtrados.filter((d) => {
    if (!d.fecha_vencimiento) return false
    const v = new Date(d.fecha_vencimiento); v.setHours(0, 0, 0, 0)
    const diff = (v.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  }).reduce((s, d) => s + d.total, 0)

  async function marcarCobrado(doc_id: string) {
    if (!confirm('¿Confirmar cobro?')) return
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
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Vencido (sin cobrar)</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(totalVencido)}</p>
          <p className="text-xs text-red-500 mt-0.5">{filtrados.filter((d) => d.fecha_vencimiento && new Date(d.fecha_vencimiento) < hoy).length} documentos</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Por cobrar (7 días)</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatCurrency(totalProximoVencer)}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total por cobrar</p>
          <p className="text-xl font-bold text-slate-700 mt-1">{formatCurrency(filtrados.reduce((s, d) => s + d.total, 0))}</p>
          <p className="text-xs text-slate-400 mt-0.5">{filtrados.length} documentos</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-48">
            <option value="">Todos los clientes</option>
            {clientes.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
          </select>
          <span className="text-xs text-slate-400 ml-auto">
            <span className="text-amber-600 font-medium">0-30d</span> · <span className="text-orange-600 font-medium">31-60d</span> · <span className="text-red-600 font-medium">61-90d</span> · <span className="text-red-900 font-medium">+90d</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Cliente</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Documento</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Emisión</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Vencimiento</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Antigüedad</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">No hay documentos pendientes de cobro.</td></tr>
              ) : (
                filtrados.map((d) => {
                  const ref = d.fecha_vencimiento ?? d.fecha_emision
                  const dias = diasDesdeHoy(ref)
                  const t = tramo(dias)
                  return (
                    <tr key={d.id} className={cn('hover:bg-slate-50 transition-colors', { 'bg-red-50/20': dias > 0 })}>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-slate-800 text-sm">{d.cliente?.razon_social ?? '—'}</p>
                        <p className="text-xs text-slate-400">{d.cliente?.rut}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {d.tipo_documento?.abreviatura} N° {d.numero_documento}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600 tabular-nums">{formatDate(d.fecha_emision)}</td>
                      <td className="px-4 py-2.5 text-xs tabular-nums">
                        {d.fecha_vencimiento ? formatDate(d.fecha_vencimiento) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn('inline-block text-xs px-2 py-0.5 rounded border font-medium', TRAMO_STYLE[t])}>
                          {t === 'vigente' ? 'Al día' : `${dias}d vencido`}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold tabular-nums">{formatCurrency(d.total)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', {
                          'bg-emerald-100 text-emerald-800': d.estado === 'emitido',
                          'bg-indigo-100 text-indigo-700':   d.estado === 'contabilizado',
                        })}>
                          {d.estado === 'emitido' ? 'Emitido' : 'Contabilizado'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => marcarCobrado(d.id)} disabled={procesando === d.id}
                          className="text-xs px-2.5 py-1 rounded-md bg-green-50 hover:bg-green-100 text-green-700 font-medium disabled:opacity-50 transition-colors whitespace-nowrap">
                          {procesando === d.id ? '...' : 'Marcar Cobrado'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {filtrados.length > 0 && (
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={5} className="px-5 py-2.5 text-xs font-semibold text-slate-600 text-right">Total por cobrar:</td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold tabular-nums">
                    {formatCurrency(filtrados.reduce((s, d) => s + d.total, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
