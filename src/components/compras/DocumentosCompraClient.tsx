'use client'

import { useState, useMemo } from 'react'
import type { DocumentoCompra } from '@/types/compras.types'
import { ESTADO_COMPRA_LABELS } from '@/types/compras.types'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

interface Props {
  documentos: DocumentoCompra[]
  empresa_id: string
}

export default function DocumentosCompraClient({ documentos }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const filtrados = useMemo(() => {
    const termino = busqueda.toLowerCase()
    return documentos.filter((d) => {
      const coincide =
        !busqueda ||
        (d.proveedor?.razon_social ?? '').toLowerCase().includes(termino) ||
        d.numero_documento.includes(termino) ||
        (d.proveedor?.rut ?? '').includes(termino)
      const estadoOk = filtroEstado === 'todos' || d.estado === filtroEstado
      return coincide && estadoOk
    })
  }, [documentos, busqueda, filtroEstado])

  const totalNeto = filtrados.reduce((s, d) => s + d.neto, 0)
  const totalIVA = filtrados.reduce((s, d) => s + d.iva, 0)
  const totalBruto = filtrados.reduce((s, d) => s + d.total, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Filtros */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar proveedor, N° documento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="todos">Todos los estados</option>
          {Object.entries(ESTADO_COMPRA_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Proveedor</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Documento</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Neto</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">No hay documentos que coincidan.</td>
              </tr>
            ) : (
              filtrados.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-slate-800">{d.proveedor?.razon_social ?? '—'}</p>
                    <p className="text-xs text-slate-400">{d.proveedor?.rut}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    <p className="font-medium">{d.tipo_documento?.abreviatura} N° {d.numero_documento}</p>
                    {d.referencia && <p className="text-slate-400">{d.referencia}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{formatDate(d.fecha_emision)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.neto)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.iva)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums">{formatCurrency(d.total)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', {
                      'bg-amber-100 text-amber-700': d.estado === 'pendiente',
                      'bg-blue-100 text-blue-700': d.estado === 'contabilizado',
                      'bg-green-100 text-green-700': d.estado === 'pagado',
                      'bg-red-100 text-red-700': d.estado === 'anulado',
                    })}>
                      {ESTADO_COMPRA_LABELS[d.estado]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtrados.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={3} className="px-5 py-2.5 text-xs font-semibold text-slate-600 text-right">
                  Totales ({filtrados.length}):
                </td>
                <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalNeto)}</td>
                <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalIVA)}</td>
                <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalBruto)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
