'use client'

import { useCallback } from 'react'
import * as XLSX from 'xlsx'
import type { BiResumenAnual } from '@/services/bi.service'
import { formatCurrency } from '@/lib/utils'

interface Props {
  resumen: BiResumenAnual
  resumenAnterior?: BiResumenAnual
}

function varPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return ((actual - anterior) / anterior) * 100
}

export default function ResumenAnualTable({ resumen, resumenAnterior }: Props) {
  const mesesConDatos = resumen.meses.filter((m) =>
    m.ventas > 0 || m.compras > 0 || m.flujo_ingreso > 0
  )

  const exportarExcel = useCallback(() => {
    const headers = ['Mes', 'Ventas', 'Compras', 'Resultado', 'Masa Salarial', 'Flujo Caja']
    if (resumenAnterior) headers.push('Var. Ventas %')
    const rows = [
      [`Resumen Anual ${resumen.anio}`],
      [],
      headers,
      ...resumen.meses.map((m) => {
        const row: (string | number)[] = [
          m.nombre, m.ventas, m.compras, m.resultado, m.masa_salarial,
          m.flujo_ingreso - m.flujo_egreso,
        ]
        if (resumenAnterior) {
          const mAnt = resumenAnterior.meses[m.mes - 1]
          const v = varPct(m.ventas, mAnt.ventas)
          row.push(v !== null ? `${v.toFixed(1)}%` : '—')
        }
        return row
      }),
      [],
      ['TOTAL AÑO', resumen.totales.ventas, resumen.totales.compras,
        resumen.totales.resultado, resumen.totales.masa_salarial, resumen.totales.flujo_caja],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Resumen ${resumen.anio}`)
    XLSX.writeFile(wb, `bi_resumen_anual_${resumen.anio}.xlsx`)
  }, [resumen, resumenAnterior])

  if (mesesConDatos.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        Sin datos para el año {resumen.anio}.
      </div>
    )
  }

  const maxVentas = Math.max(...resumen.meses.map((m) => m.ventas), 1)

  return (
    <div className="space-y-4">
      {/* Mini barras */}
      <div className="grid grid-cols-12 gap-1 h-20 items-end">
        {resumen.meses.map((m) => (
          <div key={m.mes} className="flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-t-sm bg-emerald-500"
              style={{ height: `${(m.ventas / maxVentas) * 64}px`, minHeight: m.ventas > 0 ? '2px' : '0' }}
              title={`${m.nombre}: ${formatCurrency(m.ventas)}`}
            />
            <span className="text-xs text-slate-400 leading-tight">{m.nombre.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Tabla + export */}
      <div className="flex justify-end">
        <button onClick={exportarExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Mes</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Ventas</th>
              {resumenAnterior && (
                <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-400">Var. %</th>
              )}
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Compras</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Resultado</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Masa Salarial</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Flujo Caja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resumen.meses.map((m) => {
              const mAnt = resumenAnterior?.meses[m.mes - 1]
              const vv = mAnt ? varPct(m.ventas, mAnt.ventas) : null
              return (
                <tr key={m.mes} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-700 font-medium">{m.nombre}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-700">
                    {m.ventas > 0 ? formatCurrency(m.ventas) : '—'}
                  </td>
                  {resumenAnterior && (
                    <td className={`py-2 px-3 text-right tabular-nums text-xs ${vv === null ? 'text-slate-300' : vv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {vv === null ? '—' : `${vv >= 0 ? '▲' : '▼'} ${Math.abs(vv).toFixed(1)}%`}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600">
                    {m.compras > 0 ? formatCurrency(m.compras) : '—'}
                  </td>
                  <td className={`py-2 px-3 text-right tabular-nums font-medium ${m.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.ventas > 0 || m.compras > 0 ? formatCurrency(m.resultado) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-500">
                    {m.masa_salarial > 0 ? formatCurrency(m.masa_salarial) : '—'}
                  </td>
                  <td className={`py-2 px-3 text-right tabular-nums ${(m.flujo_ingreso - m.flujo_egreso) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {m.flujo_ingreso > 0 || m.flujo_egreso > 0 ? formatCurrency(m.flujo_ingreso - m.flujo_egreso) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50">
            <tr>
              <td className="py-2.5 px-3 text-sm font-semibold text-slate-800">Total año</td>
              <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-800">{formatCurrency(resumen.totales.ventas)}</td>
              {resumenAnterior && (
                <td className={`py-2.5 px-3 text-right tabular-nums text-xs font-semibold ${
                  varPct(resumen.totales.ventas, resumenAnterior.totales.ventas) === null ? 'text-slate-300'
                  : (varPct(resumen.totales.ventas, resumenAnterior.totales.ventas) ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {(() => {
                    const v = varPct(resumen.totales.ventas, resumenAnterior.totales.ventas)
                    return v === null ? '—' : `${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(1)}%`
                  })()}
                </td>
              )}
              <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-slate-700">{formatCurrency(resumen.totales.compras)}</td>
              <td className={`py-2.5 px-3 text-right tabular-nums font-bold ${resumen.totales.resultado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(resumen.totales.resultado)}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-slate-600">{formatCurrency(resumen.totales.masa_salarial)}</td>
              <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${resumen.totales.flujo_caja >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(resumen.totales.flujo_caja)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {resumenAnterior && (
        <p className="text-xs text-slate-400 text-right">Var. % calculada vs {resumenAnterior.anio}</p>
      )}
    </div>
  )
}
