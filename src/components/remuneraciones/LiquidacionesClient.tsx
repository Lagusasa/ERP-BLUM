'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Liquidacion } from '@/types/remuneraciones.types'
import { ESTADO_LIQUIDACION_LABELS } from '@/types/remuneraciones.types'
import { formatCurrency, formatRut, cn } from '@/lib/utils'

interface Props {
  liquidaciones: Liquidacion[]
  mes: number
  anio: number
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function LiquidacionesClient({ liquidaciones, mes, anio }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtradas = useMemo(() => {
    const t = busqueda.toLowerCase()
    return liquidaciones.filter(
      (l) =>
        !busqueda ||
        (l.trabajador?.nombre ?? '').toLowerCase().includes(t) ||
        (l.trabajador?.apellido_paterno ?? '').toLowerCase().includes(t) ||
        (l.trabajador?.rut ?? '').includes(t)
    )
  }, [liquidaciones, busqueda])

  const totalLiquido = filtradas.reduce((s, l) => s + l.sueldo_liquido, 0)
  const totalImponible = filtradas.reduce((s, l) => s + l.total_imponible, 0)
  const totalDescuentos = filtradas.reduce((s, l) => s + l.total_descuentos, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Período: <span className="font-medium">{MESES[mes - 1]} {anio}</span>
        </p>
        <Link
          href={`/remuneraciones/liquidaciones/nueva?mes=${mes}&anio=${anio}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva liquidación
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar trabajador..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Trabajador</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total Imponible</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Descuentos</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Sueldo Líquido</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No hay liquidaciones para este período.
                  </td>
                </tr>
              ) : (
                filtradas.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">
                        {l.trabajador?.nombre} {l.trabajador?.apellido_paterno}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{formatRut(l.trabajador?.rut ?? '')}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums">{formatCurrency(l.total_imponible)}</td>
                    <td className="px-4 py-3 text-right text-xs text-red-600 tabular-nums">-{formatCurrency(l.total_descuentos)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-slate-900">{formatCurrency(l.sueldo_liquido)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', {
                        'bg-yellow-100 text-yellow-700': l.estado === 'borrador',
                        'bg-blue-100 text-blue-700': l.estado === 'aprobada',
                        'bg-green-100 text-green-700': l.estado === 'pagada',
                        'bg-red-100 text-red-700': l.estado === 'anulada',
                      })}>
                        {ESTADO_LIQUIDACION_LABELS[l.estado]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtradas.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td className="px-5 py-2.5 text-xs font-semibold text-slate-600">Totales ({filtradas.length}):</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold tabular-nums">{formatCurrency(totalImponible)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-red-600 tabular-nums">-{formatCurrency(totalDescuentos)}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold tabular-nums">{formatCurrency(totalLiquido)}</td>
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
