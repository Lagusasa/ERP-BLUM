'use client'

import type { BalanceComprobacionLinea } from '@/types/reportes.types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  lineas: BalanceComprobacionLinea[]
}

function Monto({ v }: { v: number }) {
  if (v === 0) return <td className="px-2 py-2 text-right text-xs text-slate-300 tabular-nums">—</td>
  return <td className="px-2 py-2 text-right text-xs text-slate-700 tabular-nums">{formatCurrency(v)}</td>
}

function Total({ v }: { v: number }) {
  return (
    <td className="px-2 py-2.5 text-right text-xs font-semibold text-slate-800 tabular-nums bg-slate-50">
      {v === 0 ? '—' : formatCurrency(v)}
    </td>
  )
}

export default function BalanceComprobacionClient({ lineas }: Props) {
  if (lineas.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-6 py-12 text-center text-slate-400">
        No hay movimientos aprobados en el período seleccionado.
      </div>
    )
  }

  const sum = (key: keyof BalanceComprobacionLinea) =>
    lineas.reduce((s, l) => s + (l[key] as number), 0)

  const totDebe    = sum('total_debe')
  const totHaber   = sum('total_haber')
  const totDeudor  = sum('saldo_deudor')
  const totAcreed  = sum('saldo_acreedor')
  const totBalD    = sum('balance_debe')
  const totBalH    = sum('balance_haber')
  const totResD    = sum('resultado_debe')
  const totResH    = sum('resultado_haber')

  const resultado = totResH - totResD
  const thGroup   = 'px-2 py-2 text-center text-xs font-semibold text-white bg-slate-700 border-x border-slate-600'
  const thCol     = 'px-2 py-1.5 text-right text-xs font-medium text-slate-500'

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
          <thead>
            {/* Grupos */}
            <tr className="border-b border-slate-200">
              <th colSpan={2} className="px-4 py-2 text-left text-xs text-slate-400 font-medium bg-slate-50"></th>
              <th colSpan={2} className={thGroup}>Sumas</th>
              <th colSpan={2} className={`${thGroup} border-l border-slate-600`}>Saldos</th>
              <th colSpan={2} className={`${thGroup} border-l border-slate-600`}>Balance</th>
              <th colSpan={2} className={`${thGroup} border-l border-slate-600`}>Resultados</th>
            </tr>
            {/* Subheaders */}
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-1.5 text-xs font-medium text-slate-500 w-20">Código</th>
              <th className="text-left px-4 py-1.5 text-xs font-medium text-slate-500">Cuenta</th>
              <th className={thCol}>Debe</th>
              <th className={thCol}>Haber</th>
              <th className={thCol}>Deudor</th>
              <th className={thCol}>Acreedor</th>
              <th className={thCol}>Activo</th>
              <th className={thCol}>Pasivo/Pat.</th>
              <th className={thCol}>Pérdida</th>
              <th className={thCol}>Ganancia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lineas.map((l) => (
              <tr key={l.codigo} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-xs text-slate-500 font-mono">{l.codigo}</td>
                <td className="px-4 py-2 text-sm text-slate-700">{l.nombre}</td>
                <Monto v={l.total_debe} />
                <Monto v={l.total_haber} />
                <Monto v={l.saldo_deudor} />
                <Monto v={l.saldo_acreedor} />
                <Monto v={l.balance_debe} />
                <Monto v={l.balance_haber} />
                <Monto v={l.resultado_debe} />
                <Monto v={l.resultado_haber} />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300">
              <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-right text-slate-600 bg-slate-50">Totales</td>
              <Total v={totDebe} />
              <Total v={totHaber} />
              <Total v={totDeudor} />
              <Total v={totAcreed} />
              <Total v={totBalD} />
              <Total v={totBalH} />
              <Total v={totResD} />
              <Total v={totResH} />
            </tr>
            <tr className="border-t border-slate-200">
              <td colSpan={8} className="px-4 py-2 text-xs text-right text-slate-500 bg-slate-50">
                {resultado >= 0
                  ? <span>Utilidad del período: <strong className="text-green-700">{formatCurrency(resultado)}</strong></span>
                  : <span>Pérdida del período: <strong className="text-red-700">{formatCurrency(-resultado)}</strong></span>
                }
              </td>
              <td className="px-2 py-2 text-right text-xs font-semibold text-green-700 bg-green-50 tabular-nums">
                {resultado >= 0 ? formatCurrency(resultado) : '—'}
              </td>
              <td className="px-2 py-2 text-right text-xs font-semibold text-red-700 bg-red-50 tabular-nums">
                {resultado < 0 ? formatCurrency(-resultado) : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
