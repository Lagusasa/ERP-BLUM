'use client'

import type { FlujoCajaResumen, FlujoCajaItem } from '@/types/reportes.types'
import { formatCurrency, cn } from '@/lib/utils'

interface Props {
  data: FlujoCajaResumen
}

function Seccion({
  titulo, items, neto, color,
}: {
  titulo: string
  items: FlujoCajaItem[]
  neto: number
  color: 'blue' | 'violet' | 'amber'
}) {
  const colorMap = {
    blue:   { header: 'bg-blue-800',   badge: neto >= 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-700' },
    violet: { header: 'bg-violet-800', badge: neto >= 0 ? 'bg-violet-50 border-violet-200 text-violet-800' : 'bg-red-50 border-red-200 text-red-700' },
    amber:  { header: 'bg-amber-700',  badge: neto >= 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-700' },
  }
  const c = colorMap[color]

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className={`${c.header} px-5 py-3`}>
        <p className="text-sm font-semibold text-white">{titulo}</p>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">Sin movimientos en el período.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-sm text-slate-700">{item.categoria}</span>
              <span className={cn('text-sm tabular-nums font-medium', item.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600')}>
                {item.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(item.total)}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className={`flex items-center justify-between px-5 py-3 border-t border-slate-200 ${c.badge} border`}>
        <span className="text-sm font-bold">Flujo neto {titulo.toLowerCase()}</span>
        <span className="text-sm font-bold tabular-nums">
          {neto >= 0 ? '+' : ''}{formatCurrency(neto)}
        </span>
      </div>
    </div>
  )
}

export default function FlujoCajaClient({ data }: Props) {
  return (
    <div className="space-y-5">
      <Seccion titulo="Actividades de Operación"     items={data.operacion.items}      neto={data.operacion.neto}      color="blue"   />
      <Seccion titulo="Actividades de Inversión"     items={data.inversion.items}      neto={data.inversion.neto}      color="violet" />
      <Seccion titulo="Actividades de Financiamiento" items={data.financiamiento.items} neto={data.financiamiento.neto} color="amber"  />

      {/* Resumen */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-800 px-5 py-3">
          <p className="text-sm font-semibold text-white">Variación neta del efectivo</p>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-5 py-2.5">
            <span className="text-sm text-slate-600">Flujo de operación</span>
            <span className={cn('text-sm tabular-nums', data.operacion.neto >= 0 ? 'text-green-600' : 'text-red-600')}>
              {data.operacion.neto >= 0 ? '+' : ''}{formatCurrency(data.operacion.neto)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-2.5">
            <span className="text-sm text-slate-600">Flujo de inversión</span>
            <span className={cn('text-sm tabular-nums', data.inversion.neto >= 0 ? 'text-green-600' : 'text-red-600')}>
              {data.inversion.neto >= 0 ? '+' : ''}{formatCurrency(data.inversion.neto)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-2.5">
            <span className="text-sm text-slate-600">Flujo de financiamiento</span>
            <span className={cn('text-sm tabular-nums', data.financiamiento.neto >= 0 ? 'text-green-600' : 'text-red-600')}>
              {data.financiamiento.neto >= 0 ? '+' : ''}{formatCurrency(data.financiamiento.neto)}
            </span>
          </div>
          <div className={cn('flex items-center justify-between px-5 py-3 font-bold', data.variacion_neta >= 0 ? 'bg-green-50' : 'bg-red-50')}>
            <span className={cn('text-sm', data.variacion_neta >= 0 ? 'text-green-900' : 'text-red-900')}>
              VARIACIÓN NETA DEL EFECTIVO
            </span>
            <span className={cn('text-lg tabular-nums', data.variacion_neta >= 0 ? 'text-green-700' : 'text-red-700')}>
              {data.variacion_neta >= 0 ? '+' : ''}{formatCurrency(data.variacion_neta)}
            </span>
          </div>
        </div>
      </div>

      {/* Saldos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Saldo inicial (cuentas)</p>
          <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(data.saldo_inicial)}</p>
        </div>
        <div className={cn('border rounded-xl p-4', data.variacion_neta >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Variación período</p>
          <p className={cn('text-xl font-bold mt-1 tabular-nums', data.variacion_neta >= 0 ? 'text-green-700' : 'text-red-700')}>
            {data.variacion_neta >= 0 ? '+' : ''}{formatCurrency(data.variacion_neta)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Saldo final (cuentas)</p>
          <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(data.saldo_final)}</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
        Elaborado por el método directo desde movimientos de tesorería.
        Los saldos inicial y final corresponden al total de cuentas bancarias activas.
      </div>
    </div>
  )
}
