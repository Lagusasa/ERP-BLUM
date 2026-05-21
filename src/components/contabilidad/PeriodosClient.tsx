'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PeriodoContable } from '@/types/contabilidad.types'
import { formatDate } from '@/lib/utils'

interface Props {
  empresa_id: string
  periodos: PeriodoContable[]
  anio: number
  meses: string[]
}

const MESES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function PeriodosClient({ empresa_id, periodos, anio, meses }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const periodoMap = new Map(periodos.map((p) => [p.mes, p]))

  async function abrirPeriodo(mes: number) {
    setLoading(`open-${mes}`)
    setError('')
    const res = await fetch('/api/contabilidad/periodos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, anio, mes }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(null); return }
    setLoading(null)
    router.refresh()
  }

  async function cambiarEstado(id: string, estado: 'abierto' | 'cerrado') {
    setLoading(id)
    setError('')
    const res = await fetch('/api/contabilidad/periodos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(null); return }
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Navegación de año */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`?anio=${anio - 1}`)}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
        >
          ‹
        </button>
        <span className="text-lg font-bold text-slate-800 w-16 text-center">{anio}</span>
        <button
          onClick={() => router.push(`?anio=${anio + 1}`)}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
        >
          ›
        </button>
        <span className="text-xs text-slate-400 ml-2">{periodos.filter(p => p.estado === 'abierto').length} abiertos · {periodos.filter(p => p.estado === 'cerrado').length} cerrados</span>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Mes</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Apertura</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Cierre</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
              const periodo = periodoMap.get(mes)
              const isLoading = loading === (periodo?.id ?? `open-${mes}`)
              return (
                <tr key={mes} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {MESES_FULL[mes - 1]}
                    <span className="ml-2 text-xs text-slate-400">{meses[mes - 1]}</span>
                  </td>
                  <td className="px-4 py-3">
                    {!periodo ? (
                      <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500">Sin crear</span>
                    ) : periodo.estado === 'abierto' ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">Abierto</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-600">Cerrado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {periodo?.fecha_apertura ? formatDate(periodo.fecha_apertura) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {periodo?.fecha_cierre ? formatDate(periodo.fecha_cierre) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!periodo ? (
                      <button
                        onClick={() => abrirPeriodo(mes)}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg disabled:opacity-50"
                      >
                        {isLoading ? 'Abriendo…' : 'Abrir'}
                      </button>
                    ) : periodo.estado === 'abierto' ? (
                      <button
                        onClick={() => cambiarEstado(periodo.id, 'cerrado')}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs font-medium border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                      >
                        {isLoading ? 'Cerrando…' : 'Cerrar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => cambiarEstado(periodo.id, 'abierto')}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs font-medium border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                      >
                        {isLoading ? 'Reabriendo…' : 'Reabrir'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-medium">Importante</p>
        <p className="text-xs mt-1">Solo se pueden registrar comprobantes en períodos abiertos. Cerrar un período impide nuevos movimientos pero no elimina los existentes.</p>
      </div>
    </div>
  )
}
