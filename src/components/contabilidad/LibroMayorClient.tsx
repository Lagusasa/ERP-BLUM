'use client'

import { useCallback } from 'react'
import * as XLSX from 'xlsx'
import type { LibroMayorCuenta } from '@/services/contabilidad.service'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  mayor: LibroMayorCuenta[]
  empresa_razon_social: string
  empresa_rut: string
  desde: string
  hasta: string
  cuenta_nombre?: string
}

export default function LibroMayorClient({
  mayor,
  empresa_razon_social,
  empresa_rut,
  desde,
  hasta,
  cuenta_nombre,
}: Props) {

  const exportarExcel = useCallback(() => {
    const wb = XLSX.utils.book_new()
    const rows: (string | number)[][] = []

    // Encabezado del documento
    rows.push([empresa_razon_social])
    rows.push([`RUT: ${empresa_rut}`])
    rows.push(['LIBRO MAYOR'])
    rows.push([`Período: ${formatDate(desde)} al ${formatDate(hasta)}`])
    if (cuenta_nombre) rows.push([`Cuenta: ${cuenta_nombre}`])
    rows.push([]) // línea vacía

    for (const cuenta of mayor) {
      // Cabecera de cuenta
      rows.push([
        cuenta.codigo,
        cuenta.nombre,
        cuenta.clase.toUpperCase(),
        '',
        '',
        `Saldo anterior: ${cuenta.saldo_anterior}`,
      ])

      // Encabezados de columnas
      rows.push(['Fecha', 'N° Comp.', 'Glosa', 'Debe', 'Haber', 'Saldo'])

      // Saldo anterior
      if (cuenta.saldo_anterior !== 0) {
        rows.push(['Saldo anterior al período', '', '', '', '', cuenta.saldo_anterior])
      }

      // Movimientos
      for (const m of cuenta.movimientos) {
        rows.push([
          m.fecha,
          `#${m.numero}`,
          m.glosa || '',
          m.debe > 0 ? m.debe : '',
          m.haber > 0 ? m.haber : '',
          m.saldo,
        ])
      }

      // Total cuenta
      rows.push([
        `Total (${cuenta.movimientos.length} mov.)`,
        '',
        '',
        cuenta.total_debe,
        cuenta.total_haber,
        cuenta.saldo_final,
      ])

      rows.push([]) // separador
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Anchos de columna
    ws['!cols'] = [
      { wch: 14 }, // Fecha
      { wch: 10 }, // N° Comp.
      { wch: 42 }, // Glosa
      { wch: 14 }, // Debe
      { wch: 14 }, // Haber
      { wch: 14 }, // Saldo
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Libro Mayor')

    const nombreArchivo = `libro-mayor_${desde}_${hasta}.xlsx`
    XLSX.writeFile(wb, nombreArchivo)
  }, [mayor, empresa_razon_social, empresa_rut, desde, hasta, cuenta_nombre])

  return (
    <>
      {/* Botones de acción — ocultos en impresión */}
      <div className="flex items-center gap-2 justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Imprimir
        </button>
        <button
          onClick={exportarExcel}
          disabled={mayor.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Exportar Excel
        </button>
      </div>

      {/* Encabezado solo en impresión */}
      <div className="hidden print:block mb-4">
        <div className="flex items-start justify-between pb-3 border-b-2 border-black">
          <div>
            <p className="text-[12pt] font-bold uppercase">{empresa_razon_social}</p>
            <p className="text-[9pt] text-gray-600">RUT: {empresa_rut}</p>
          </div>
          <div className="text-right text-[9pt] text-gray-500">
            <p>ERP SaaS Chile</p>
            <p>Impreso: {new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>
        <div className="mt-3 text-center">
          <h1 className="text-[13pt] font-bold uppercase tracking-widest">Libro Mayor</h1>
          <p className="text-[9pt] text-gray-600">
            Período: {formatDate(desde)} al {formatDate(hasta)}
            {cuenta_nombre ? ` — Cuenta: ${cuenta_nombre}` : ''}
          </p>
        </div>
        <div className="mt-2 border-t border-gray-400" />
      </div>

      {/* Contenido */}
      {mayor.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm print:hidden">
          No hay movimientos aprobados en el período seleccionado.
        </div>
      ) : (
        <div className="space-y-4">
          {mayor.map((cuenta) => (
            <div key={cuenta.cuenta_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden print:border print:border-gray-300 print:rounded-none print:mb-4">
              {/* Header cuenta */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200 print:bg-gray-100 print:border-b print:border-gray-300">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide print:text-black">{cuenta.codigo}</span>
                  <span className="ml-2 text-sm font-semibold text-slate-800">{cuenta.nombre}</span>
                  <span className="ml-2 text-xs text-slate-400 capitalize print:text-gray-500">{cuenta.clase}</span>
                </div>
                <div className="flex gap-4 text-xs text-slate-500 flex-wrap print:gap-3 print:text-[8pt]">
                  <span>Saldo anterior: <strong className="text-slate-700 print:text-black">{formatCurrency(cuenta.saldo_anterior)}</strong></span>
                  <span className="print:text-black">Debe: <strong className="text-green-600 print:text-black">{formatCurrency(cuenta.total_debe)}</strong></span>
                  <span className="print:text-black">Haber: <strong className="text-red-600 print:text-black">{formatCurrency(cuenta.total_haber)}</strong></span>
                  <span className={`font-bold ${cuenta.saldo_final >= 0 ? 'text-slate-800' : 'text-red-600'} print:text-black`}>
                    Saldo: {formatCurrency(cuenta.saldo_final)}
                  </span>
                </div>
              </div>

              <table className="w-full text-sm print:text-[8pt]">
                <thead className="border-b border-slate-100 print:border-b print:border-gray-300">
                  <tr>
                    <th className="text-left px-5 py-2 text-xs font-medium text-slate-500 print:px-2 print:py-1 print:text-black">Fecha</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 print:px-2 print:py-1 print:text-black">N° Comp.</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 print:px-2 print:py-1 print:text-black">Glosa</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-slate-500 print:px-2 print:py-1 print:text-black">Debe</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-slate-500 print:px-2 print:py-1 print:text-black">Haber</th>
                    <th className="text-right px-5 py-2 text-xs font-medium text-slate-500 print:px-2 print:py-1 print:text-black">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 print:divide-gray-200">
                  {cuenta.saldo_anterior !== 0 && (
                    <tr className="bg-slate-50/50 print:bg-white">
                      <td className="px-5 py-1.5 text-xs text-slate-400 print:px-2 print:py-1 print:text-gray-500" colSpan={3}>Saldo anterior al período</td>
                      <td className="px-4 py-1.5 text-right text-xs text-slate-400 print:px-2 print:py-1 print:text-gray-500">—</td>
                      <td className="px-4 py-1.5 text-right text-xs text-slate-400 print:px-2 print:py-1 print:text-gray-500">—</td>
                      <td className="px-5 py-1.5 text-right text-xs font-medium text-slate-500 tabular-nums print:px-2 print:py-1 print:text-black">
                        {formatCurrency(cuenta.saldo_anterior)}
                      </td>
                    </tr>
                  )}
                  {cuenta.movimientos.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50 print:hover:bg-white">
                      <td className="px-5 py-2 text-xs text-slate-500 print:px-2 print:py-1 print:text-black">{formatDate(m.fecha)}</td>
                      <td className="px-4 py-2 text-xs text-slate-500 print:px-2 print:py-1 print:text-black">#{m.numero}</td>
                      <td className="px-4 py-2 text-slate-700 truncate max-w-xs print:px-2 print:py-1 print:text-black">{m.glosa || '—'}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-green-700 print:px-2 print:py-1 print:text-black">
                        {m.debe > 0 ? formatCurrency(m.debe) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-red-600 print:px-2 print:py-1 print:text-black">
                        {m.haber > 0 ? formatCurrency(m.haber) : '—'}
                      </td>
                      <td className={`px-5 py-2 text-right tabular-nums font-medium print:px-2 print:py-1 print:text-black ${m.saldo >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                        {formatCurrency(m.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 print:border-t-2 print:border-black print:bg-white">
                  <tr>
                    <td colSpan={3} className="px-5 py-2 text-xs font-semibold text-slate-600 print:px-2 print:py-1 print:text-black">
                      Total período ({cuenta.movimientos.length} movimientos)
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold text-green-700 print:px-2 print:py-1 print:text-black">
                      {formatCurrency(cuenta.total_debe)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold text-red-600 print:px-2 print:py-1 print:text-black">
                      {formatCurrency(cuenta.total_haber)}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums font-bold print:px-2 print:py-1 print:text-black ${cuenta.saldo_final >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                      {formatCurrency(cuenta.saldo_final)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Pie de página solo en impresión */}
      {mayor.length > 0 && (
        <div className="hidden print:block mt-6 text-center text-[8pt] text-gray-400 border-t border-gray-300 pt-2">
          Libro Mayor — {empresa_razon_social} ({empresa_rut}) — {formatDate(desde)} al {formatDate(hasta)}
        </div>
      )}
    </>
  )
}
