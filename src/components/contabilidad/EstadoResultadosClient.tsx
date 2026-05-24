'use client'

import { useCallback } from 'react'
import * as XLSX from 'xlsx'
import type { EstadoResultados, ResultadoItem } from '@/types/reportes.types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: EstadoResultados
}

function Grupo({ titulo, items, total, positivo }: { titulo: string; items: ResultadoItem[]; total: number; positivo: boolean }) {
  return (
    <div>
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{titulo}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-400">Sin movimientos</p>
      ) : (
        items.map((item) => (
          <div key={item.codigo} className="flex items-center justify-between px-4 py-2 border-b border-slate-100 hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono w-16">{item.codigo}</span>
              <span className="text-sm text-slate-700">{item.nombre}</span>
            </div>
            <span className="text-sm tabular-nums text-slate-700">{formatCurrency(item.monto)}</span>
          </div>
        ))
      )}
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-slate-200 bg-slate-50">
        <span className="text-sm font-semibold text-slate-600">Total {titulo}</span>
        <span className={`text-sm font-bold tabular-nums ${positivo ? 'text-green-700' : 'text-red-700'}`}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}

function ResultadoLinea({ label, monto, destacado }: { label: string; monto: number; destacado?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 border-b border-slate-100 ${destacado ? 'bg-emerald-50' : ''}`}>
      <span className={`text-sm font-semibold ${destacado ? 'text-emerald-900' : 'text-slate-700'}`}>{label}</span>
      <span className={`text-sm font-bold tabular-nums ${monto >= 0 ? (destacado ? 'text-emerald-900' : 'text-green-700') : 'text-red-700'}`}>
        {formatCurrency(monto)}
      </span>
    </div>
  )
}

export default function EstadoResultadosClient({ data }: Props) {
  const exportarExcel = useCallback(() => {
    const rows: (string | number)[][] = [
      ['Estado de Resultados'],
      [],
      ['Código', 'Cuenta', 'Monto'],
      ['INGRESOS'],
      ...data.ingresos.map((i) => [i.codigo, i.nombre, i.monto]),
      ['', 'TOTAL INGRESOS', data.total_ingresos],
      [],
      ['COSTOS'],
      ...data.costos.map((i) => [i.codigo, i.nombre, i.monto]),
      ['', 'TOTAL COSTOS', data.total_costos],
      ['', 'RESULTADO BRUTO', data.resultado_bruto],
      [],
      ['GASTOS'],
      ...data.gastos.map((i) => [i.codigo, i.nombre, i.monto]),
      ['', 'TOTAL GASTOS', data.total_gastos],
      [],
      ['', 'RESULTADO DEL EJERCICIO', data.resultado_neto],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Estado de Resultados')
    XLSX.writeFile(wb, `estado_resultados_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [data])

  return (
    <div className="space-y-3">
      <div className="flex justify-end print:hidden">
        <button onClick={exportarExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel
        </button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Grupo titulo="Ingresos" items={data.ingresos} total={data.total_ingresos} positivo />
        <Grupo titulo="Costos" items={data.costos} total={data.total_costos} positivo={false} />
        <ResultadoLinea label="Resultado Bruto" monto={data.resultado_bruto} />
        <Grupo titulo="Gastos" items={data.gastos} total={data.total_gastos} positivo={false} />
        <ResultadoLinea label="Resultado del Ejercicio" monto={data.resultado_neto} destacado />
      </div>
    </div>
  )
}
