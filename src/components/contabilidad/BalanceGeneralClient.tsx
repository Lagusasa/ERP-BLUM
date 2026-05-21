'use client'

import type { BalanceGeneral, BalanceItem } from '@/types/reportes.types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: BalanceGeneral
}

function Grupo({ titulo, items, total }: { titulo: string; items: BalanceItem[]; total: number }) {
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
            <span className="text-sm tabular-nums text-slate-700">{formatCurrency(item.saldo)}</span>
          </div>
        ))
      )}
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-slate-200 bg-slate-50">
        <span className="text-sm font-semibold text-slate-600">Total {titulo}</span>
        <span className="text-sm font-bold tabular-nums text-slate-800">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

export default function BalanceGeneralClient({ data }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Left: Activos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Grupo titulo="Activos" items={data.activos} total={data.total_activo} />
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-t-2 border-emerald-200">
          <span className="text-sm font-bold text-emerald-900">TOTAL ACTIVOS</span>
          <span className="text-sm font-bold tabular-nums text-emerald-900">{formatCurrency(data.total_activo)}</span>
        </div>
      </div>

      {/* Right: Pasivos + Patrimonio */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Grupo titulo="Pasivos" items={data.pasivos} total={data.total_pasivo} />
        <Grupo titulo="Patrimonio" items={data.patrimonio} total={data.total_patrimonio} />
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-t-2 border-emerald-200">
          <span className="text-sm font-bold text-emerald-900">TOTAL PASIVO + PATRIMONIO</span>
          <span className="text-sm font-bold tabular-nums text-emerald-900">
            {formatCurrency(data.total_pasivo + data.total_patrimonio)}
          </span>
        </div>
        {data.diferencia !== 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-red-50 border-t border-red-200">
            <span className="text-xs text-red-700">Diferencia (desequilibrio)</span>
            <span className="text-xs font-bold tabular-nums text-red-700">{formatCurrency(data.diferencia)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
