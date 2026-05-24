'use client'

import { useState, useMemo, useCallback } from 'react'
import * as XLSX from 'xlsx'
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

  const exportarExcel = useCallback(() => {
    const contraparteLabel = tipo === 'compras' ? 'Proveedor' : 'Cliente'
    const rows = [
      [`Libro IVA ${tipo === 'compras' ? 'Compras' : 'Ventas'} — ${MESES[mes - 1]} ${anio}`],
      [],
      ['Fecha', 'Tipo Doc', 'N° Documento', contraparteLabel, 'RUT', 'Neto', 'Exento', 'IVA', 'Total', 'Estado'],
      ...filtrados.map((d) => [
        d.fecha_emision, d.tipo_doc, d.numero_documento, d.razon_social, d.rut,
        d.neto, d.exento, d.iva, d.total, d.estado,
      ]),
      [],
      ['', '', '', '', 'TOTALES', totalNeto, totalExento, totalIVA, totalTotal, ''],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 13 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Libro IVA ${tipo === 'compras' ? 'Compras' : 'Ventas'}`)
    XLSX.writeFile(wb, `libro_iva_${tipo}_${anio}_${String(mes).padStart(2, '0')}.xlsx`)
  }, [filtrados, tipo, mes, anio, totalNeto, totalExento, totalIVA, totalTotal])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-600">
          Libro IVA {tipo === 'compras' ? 'Compras' : 'Ventas'} — <span className="font-medium">{MESES[mes - 1]} {anio}</span>
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500">{documentos.length} documentos</p>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
          <button onClick={exportarExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Excel
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 print:hidden">
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar RUT, razón social, N° doc..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
                        'bg-emerald-100 text-emerald-800': d.estado === 'emitido',
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
