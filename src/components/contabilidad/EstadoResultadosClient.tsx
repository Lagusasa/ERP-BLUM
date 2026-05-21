'use client'

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
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <Grupo titulo="Ingresos" items={data.ingresos} total={data.total_ingresos} positivo />
      <Grupo titulo="Costos" items={data.costos} total={data.total_costos} positivo={false} />
      <ResultadoLinea label="Resultado Bruto" monto={data.resultado_bruto} />
      <Grupo titulo="Gastos" items={data.gastos} total={data.total_gastos} positivo={false} />
      <ResultadoLinea label="Resultado del Ejercicio" monto={data.resultado_neto} destacado />
    </div>
  )
}
