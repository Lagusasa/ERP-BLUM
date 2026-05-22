'use client'

import { useState } from 'react'
import type { AntiguedadSaldosData, AntiguedadLinea, AntiguedadBucket } from '@/types/reportes.types'

const USD = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const BUCKETS: AntiguedadBucket[] = ['0-30', '31-60', '61-90', '90+']

const BUCKET_COLORS: Record<AntiguedadBucket, string> = {
  '0-30':  'bg-emerald-50 text-emerald-700',
  '31-60': 'bg-amber-50 text-amber-700',
  '61-90': 'bg-orange-50 text-orange-700',
  '90+':   'bg-red-50 text-red-700',
}

interface Props { data: AntiguedadSaldosData }

function TablaAntiguedad({ lineas, totales }: {
  lineas: AntiguedadLinea[]
  totales: AntiguedadSaldosData['totales_cxc']
}) {
  if (lineas.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-10">Sin saldos pendientes.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: '800px' }}>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">RUT</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Nombre</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">N° doc.</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Emisión</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Vencimiento</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Total</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Días venc.</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Tramo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {lineas.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50/50">
              <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{l.rut}</td>
              <td className="px-4 py-2.5 font-medium text-slate-800">{l.nombre}</td>
              <td className="px-4 py-2.5 text-slate-600">{l.numero}</td>
              <td className="px-4 py-2.5 text-slate-500">{l.fecha_emision}</td>
              <td className="px-4 py-2.5 text-slate-500">{l.fecha_vencimiento ?? '(+30 d)'}</td>
              <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{USD(l.total)}</td>
              <td className="px-4 py-2.5 text-center">
                {l.dias_vencido === 0 ? '—' : <span className="text-orange-600 font-medium">{l.dias_vencido}</span>}
              </td>
              <td className="px-4 py-2.5 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BUCKET_COLORS[l.bucket]}`}>
                  {l.bucket}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
            <td colSpan={5} className="px-4 py-3 text-sm text-slate-600">Total</td>
            <td className="px-4 py-3 text-right tabular-nums">{USD(totales.total)}</td>
            <td />
            <td />
          </tr>
          <tr className="bg-slate-50">
            <td colSpan={8} className="px-4 pb-3">
              <div className="flex gap-3">
                {BUCKETS.map((b) => (
                  <div key={b} className={`text-xs px-2.5 py-1.5 rounded-lg ${BUCKET_COLORS[b]}`}>
                    <span className="font-semibold">{b} días:</span>{' '}{USD(totales[b])}
                  </div>
                ))}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function AntiguedadSaldosClient({ data }: Props) {
  const [tab, setTab] = useState<'cxc' | 'cxp'>('cxc')

  const resumen = [
    { label: 'Total CxC pendiente', v: data.totales_cxc.total, color: 'text-emerald-700' },
    { label: 'Total CxP pendiente', v: data.totales_cxp.total, color: 'text-red-700' },
  ]

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {resumen.map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{USD(k.v)}</p>
          </div>
        ))}
        {BUCKETS.map((b) => (
          <div key={b} className={`border rounded-xl p-4 ${BUCKET_COLORS[b]}`}>
            <p className="text-xs font-medium opacity-70">CxC tramo {b} días</p>
            <p className="text-xl font-bold mt-1">{USD(data.totales_cxc[b])}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-100">
          {(['cxc', 'cxp'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'cxc' ? `CxC — Cuentas por Cobrar (${data.cxc.length})` : `CxP — Cuentas por Pagar (${data.cxp.length})`}
            </button>
          ))}
        </div>
        <TablaAntiguedad
          lineas={tab === 'cxc' ? data.cxc : data.cxp}
          totales={tab === 'cxc' ? data.totales_cxc : data.totales_cxp}
        />
      </div>
    </div>
  )
}
