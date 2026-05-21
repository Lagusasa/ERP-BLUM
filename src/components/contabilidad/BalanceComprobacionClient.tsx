'use client'

import type { BalanceComprobacionLinea } from '@/types/reportes.types'
import { formatCurrency } from '@/lib/utils'
import { MontoCell } from './ReporteLayout'

interface Props {
  lineas: BalanceComprobacionLinea[]
}

export default function BalanceComprobacionClient({ lineas }: Props) {
  if (lineas.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-6 py-12 text-center text-slate-400">
        No hay movimientos aprobados en el período seleccionado.
      </div>
    )
  }

  const totalDebe = lineas.reduce((s, l) => s + l.total_debe, 0)
  const totalHaber = lineas.reduce((s, l) => s + l.total_haber, 0)
  const totalDeudor = lineas.reduce((s, l) => s + l.saldo_deudor, 0)
  const totalAcreedor = lineas.reduce((s, l) => s + l.saldo_acreedor, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-24">Código</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Cuenta</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Debe</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Haber</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Saldo Deudor</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Saldo Acreedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineas.map((l) => (
              <tr key={l.codigo} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-xs text-slate-500 font-mono">{l.codigo}</td>
                <td className="px-4 py-2 text-slate-700">{l.nombre}</td>
                <MontoCell monto={l.total_debe} />
                <MontoCell monto={l.total_haber} />
                <MontoCell monto={l.saldo_deudor} />
                <MontoCell monto={l.saldo_acreedor} />
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
            <tr>
              <td colSpan={2} className="px-4 py-2.5 text-sm text-right text-slate-600">Totales:</td>
              <td className="px-4 py-2.5 text-right text-sm tabular-nums">{formatCurrency(totalDebe)}</td>
              <td className="px-4 py-2.5 text-right text-sm tabular-nums">{formatCurrency(totalHaber)}</td>
              <td className="px-4 py-2.5 text-right text-sm tabular-nums">{formatCurrency(totalDeudor)}</td>
              <td className="px-4 py-2.5 text-right text-sm tabular-nums">{formatCurrency(totalAcreedor)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
