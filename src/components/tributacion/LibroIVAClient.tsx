'use client'

import { useState, useMemo } from 'react'
import type { DocumentoLibroIVA } from '@/services/tributacion.service'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

interface Props {
  documentos: DocumentoLibroIVA[]
  tipo: 'compras' | 'ventas'
  mes: number
  anio: number
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function LibroIVAClient({ documentos, tipo, mes, anio }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return documentos.filter(
      (d) =>
        !busqueda ||
        d.razon_social.toLowerCase().includes(t) ||
        d.rut.includes(t) ||
        d.numero_documento.includes(t)
    )
  }, [documentos, busqueda])

  const totalNeto = filtrados.reduce((s, d) => s + d.neto, 0)
  const totalExento = filtrados.reduce((s, d) => s + d.exento, 0)
  const totalIVA = filtrados.reduce((s, d) => s + d.iva, 0)
  const totalTotal = filtrados.reduce((s, d) => s + d.total, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Libro IVA {tipo === 'compras' ? 'Compras' : 'Ventas'} — <span className="font-medium">{MESES[mes - 1]} {anio}</span>
        </p>
        <p className="text-sm text-slate-500">{documentos.length} documentos</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar RUT, razón social, N° doc..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo / N°</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">{tipo === 'compras' ? 'Proveedor' : 'Cliente'}</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Neto</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Exento</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No hay documentos para el período seleccionado.
                  </td>
                </tr>
              ) : (
                filtrados.map((d) => (
                  <tr key={d.id} className={cn('hover:bg-slate-50 transition-colors', d.estado === 'anulado' && 'opacity-50')}>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{formatDate(d.fecha_emision)}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="font-medium text-slate-700">{d.tipo_doc}</span>{' '}
                      <span className="text-slate-500">N° {d.numero_documento}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-xs font-medium text-slate-800">{d.razon_social}</p>
                      <p className="text-xs text-slate-400">{d.rut}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.neto)}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums">{d.exento > 0 ? formatCurrency(d.exento) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.iva)}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums">{formatCurrency(d.total)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', {
                        'bg-blue-100 text-blue-700': d.estado === 'emitido',
                        'bg-purple-100 text-purple-700': d.estado === 'contabilizado',
                        'bg-green-100 text-green-700': d.estado === 'cobrado' || d.estado === 'pagado',
                        'bg-red-100 text-red-700': d.estado === 'anulado',
                      })}>
                        {d.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtrados.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-xs font-semibold text-slate-600 text-right">
                    Totales ({filtrados.length}):
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalNeto)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{totalExento > 0 ? formatCurrency(totalExento) : '—'}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalIVA)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
