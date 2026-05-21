'use client'

import type { BiResumenAnual } from '@/services/bi.service'
import { formatCurrency } from '@/lib/utils'

interface Props {
  resumen: BiResumenAnual
}

export default function ResumenAnualTable({ resumen }: Props) {
  const mesesConDatos = resumen.meses.filter((m) =>
    m.ventas > 0 || m.compras > 0 || m.flujo_ingreso > 0
  )

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
              className="w-full rounded-t-sm bg-blue-500"
              style={{ height: `${(m.ventas / maxVentas) * 64}px`, minHeight: m.ventas > 0 ? '2px' : '0' }}
              title={`${m.nombre}: ${formatCurrency(m.ventas)}`}
            />
            <span className="text-xs text-slate-400 leading-tight">{m.nombre.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Tabla de datos */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">Mes</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Ventas</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Compras</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Resultado</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Masa Salarial</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500">Flujo Caja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resumen.meses.map((m) => (
              <tr key={m.mes} className="hover:bg-slate-50">
                <td className="py-2 px-3 text-slate-700 font-medium">{m.nombre}</td>
                <td className="py-2 px-3 text-right tabular-nums text-slate-700">
                  {m.ventas > 0 ? formatCurrency(m.ventas) : '—'}
                </td>
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
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50">
            <tr>
              <td className="py-2.5 px-3 text-sm font-semibold text-slate-800">Total año</td>
              <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-blue-700">{formatCurrency(resumen.totales.ventas)}</td>
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
    </div>
  )
}
