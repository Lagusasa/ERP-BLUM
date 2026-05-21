'use client'

import { useRouter, usePathname } from 'next/navigation'
import type { F22Lineas } from '@/types/sii.types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  empresa_id: string
  anio: number
  lineas: F22Lineas
}

export default function F22Client({ empresa_id, anio, lineas }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function changeYear(delta: number) {
    router.push(`${pathname}?anio=${anio + delta}`)
  }

  async function guardar() {
    await fetch('/api/sii/f22', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, anio, datos_json: lineas }),
    })
    router.refresh()
  }

  const rows: Array<{ label: string; valor: number; clase?: string }> = [
    { label: 'Resultado contable del ejercicio', valor: lineas.resultado_contable },
    { label: '(+) Agregados tributarios', valor: lineas.agregados, clase: 'text-orange-600' },
    { label: '(−) Deducciones tributarias', valor: -lineas.deducidos, clase: 'text-green-600' },
    { label: 'Renta Líquida Imponible (RLI)', valor: lineas.rli, clase: 'font-semibold text-slate-900' },
    { label: `Tasa impuesto (${(lineas.tasa * 100).toFixed(0)}%)`, valor: lineas.impuesto_determinado, clase: 'text-purple-700' },
    { label: '(−) PPM pagados en el año', valor: -lineas.ppme, clase: 'text-green-600' },
    { label: '(−) Retenciones honorarios', valor: -lineas.retenciones, clase: 'text-green-600' },
  ]

  return (
    <div className="space-y-5">
      {/* Selector de año */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <button onClick={() => changeYear(-1)} className="p-1 rounded hover:bg-slate-100">
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-800">Año tributario {anio}</span>
        <button onClick={() => changeYear(1)} className="p-1 rounded hover:bg-slate-100">
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="ml-auto">
          <button onClick={guardar}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg">
            Guardar borrador
          </button>
        </div>
      </div>

      {/* Tabla F22 */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Formulario 22 — Determinación Impuesto</h2>
          <p className="text-xs text-slate-400 mt-0.5">Calculado automáticamente desde contabilidad, RLI y honorarios.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.label} className={`flex items-center justify-between px-5 py-3 text-sm ${r.clase ?? 'text-slate-700'}`}>
              <span>{r.label}</span>
              <span className="tabular-nums font-medium">{formatCurrency(r.valor)}</span>
            </div>
          ))}
        </div>

        {/* Resultado */}
        <div className={`mx-4 mb-4 mt-2 rounded-xl p-5 ${lineas.impuesto_pagar > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <p className={`text-xs uppercase tracking-wide font-semibold ${lineas.impuesto_pagar > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {lineas.impuesto_pagar > 0 ? 'Impuesto a pagar' : 'Devolución estimada'}
          </p>
          <p className={`text-3xl font-bold tabular-nums mt-1 ${lineas.impuesto_pagar > 0 ? 'text-red-700' : 'text-green-700'}`}>
            {formatCurrency(lineas.impuesto_pagar > 0 ? lineas.impuesto_pagar : lineas.impuesto_devolver)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Estimación referencial · Consulta a tu contador.</p>
        </div>
      </div>
    </div>
  )
}
