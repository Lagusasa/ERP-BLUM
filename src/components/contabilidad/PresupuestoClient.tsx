'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PresupuestoLinea } from '@/types/reportes.types'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const USD = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function variacionColor(v: number) {
  if (v > 0) return 'text-emerald-600'
  if (v < 0) return 'text-red-600'
  return 'text-slate-400'
}

interface Props {
  lineas: PresupuestoLinea[]
  anio: number
}

export default function PresupuestoClient({ lineas: initialLineas, anio }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [lineas, setLineas] = useState(initialLineas)
  const [editandoCell, setEditandoCell] = useState<{ cuentaId: string; mes: number } | null>(null)
  const [cellVal, setCellVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [anioNav, setAnioNav] = useState(anio)

  function navAnio(delta: number) {
    const nuevo = anioNav + delta
    setAnioNav(nuevo)
    startTransition(() => router.push(`/contabilidad/presupuesto?anio=${nuevo}`))
  }

  function startEdit(cuentaId: string, mes: number, actual: number) {
    setEditandoCell({ cuentaId, mes })
    setCellVal(actual === 0 ? '' : String(actual))
  }

  async function commitEdit(linea: PresupuestoLinea, mes: number) {
    if (!editandoCell) return
    const monto = Number(cellVal) || 0
    setEditandoCell(null)

    // Optimistic update
    setLineas((prev) =>
      prev.map((l) =>
        l.cuenta_id === linea.cuenta_id
          ? {
              ...l,
              presupuesto: l.presupuesto.map((v, i) => (i === mes ? monto : v)),
              total_presupuesto: l.presupuesto.reduce((s, v, i) => s + (i === mes ? monto : v), 0),
            }
          : l
      )
    )

    setSaving(true)
    await fetch('/api/contabilidad/presupuesto', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuenta_id: linea.cuenta_id, anio: anioNav, mes: mes + 1, monto }),
    })
    setSaving(false)
  }

  const CLASE_COLORS: Record<string, string> = {
    ingreso: 'text-emerald-700 bg-emerald-50',
    costo:   'text-amber-700 bg-amber-50',
    gasto:   'text-red-700 bg-red-50',
  }

  const total_presupuesto_global = lineas.reduce((s, l) => s + l.total_presupuesto, 0)
  const total_real_global = lineas.reduce((s, l) => s + l.total_real, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navAnio(-1)} disabled={isPending}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-bold text-slate-800">{anioNav}</span>
        <button onClick={() => navAnio(1)} disabled={isPending}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {saving && <span className="text-xs text-slate-400 ml-2">Guardando…</span>}
        <div className="ml-auto text-xs text-slate-400">Haz clic en cualquier celda de presupuesto para editarla</div>
      </div>

      {/* Resumen KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Presupuesto total', v: total_presupuesto_global },
          { label: 'Real ejecutado',    v: total_real_global },
          { label: 'Variación',         v: total_real_global - total_presupuesto_global },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${variacionColor(k.v === total_real_global - total_presupuesto_global ? k.v : 0)}`}>
              {USD(k.v)}
            </p>
          </div>
        ))}
      </div>

      {lineas.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm text-slate-400">No hay cuentas de resultado con movimientos en {anioNav}.</p>
          <p className="text-xs text-slate-300 mt-1">Los movimientos contables aprobados aparecerán aquí automáticamente.</p>
        </div>
      )}

      {lineas.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs w-full" style={{ minWidth: '1400px' }}>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 w-20">Código</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500">Cuenta</th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-slate-400 w-10">Clase</th>
                  {MESES.map((m) => (
                    <th key={m} className="text-right px-2 py-3 text-xs font-semibold text-slate-500 w-24" colSpan={2}>{m}</th>
                  ))}
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500">Total Pres.</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500">Total Real</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500">Variación</th>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th colSpan={3} />
                  {MESES.map((m) => (
                    <React.Fragment key={m}>
                      <th className="text-right px-1 pb-2 text-[10px] text-slate-400 font-normal">Pres</th>
                      <th className="text-right px-1 pb-2 text-[10px] text-slate-400 font-normal">Real</th>
                    </React.Fragment>
                  ))}
                  <th colSpan={3} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lineas.map((l) => (
                  <tr key={l.cuenta_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2 font-mono text-slate-400">{l.codigo}</td>
                    <td className="px-3 py-2 font-medium text-slate-700">{l.nombre}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CLASE_COLORS[l.clase] ?? ''}`}>
                        {l.clase.slice(0, 3).toUpperCase()}
                      </span>
                    </td>
                    {l.presupuesto.map((pres, i) => {
                      const isEditing = editandoCell?.cuentaId === l.cuenta_id && editandoCell?.mes === i
                      const real = l.real[i]
                      return (
                        <React.Fragment key={`${l.cuenta_id}-${i}`}>
                          <td className="px-1 py-2 text-right">
                            {isEditing ? (
                              <input
                                autoFocus
                                type="number"
                                value={cellVal}
                                onChange={(e) => setCellVal(e.target.value)}
                                onBlur={() => commitEdit(l, i)}
                                onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(l, i); if (e.key === 'Escape') setEditandoCell(null) }}
                                className="w-20 border border-emerald-400 rounded px-1 py-0.5 text-right text-xs focus:outline-none"
                              />
                            ) : (
                              <button
                                onClick={() => startEdit(l.cuenta_id, i, pres)}
                                className={`w-full text-right px-1 py-0.5 rounded hover:bg-emerald-50 transition-colors ${pres === 0 ? 'text-slate-200' : 'text-slate-600'}`}
                              >
                                {pres === 0 ? '—' : USD(pres).replace('US$', '')}
                              </button>
                            )}
                          </td>
                          <td className={`px-1 py-2 text-right tabular-nums ${real === 0 ? 'text-slate-200' : 'text-slate-500'}`}>
                            {real === 0 ? '—' : USD(real).replace('US$', '')}
                          </td>
                        </React.Fragment>
                      )
                    })}
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-700">{USD(l.total_presupuesto)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-700">{USD(l.total_real)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-bold ${variacionColor(l.variacion)}`}>
                      {l.variacion === 0 ? '—' : (l.variacion > 0 ? '+' : '') + USD(l.variacion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
