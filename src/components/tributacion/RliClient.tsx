'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RliResumen, RliAjuste } from '@/types/reportes.types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  empresa_id: string
  anio: number
  resumen: RliResumen
}

const TASAS = [
  { label: 'Semi-Integrado (27%)', value: 0.27 },
  { label: 'Pro-Pyme (25%)', value: 0.25 },
]

function Linea({ label, monto, colorClass, bold }: { label: string; monto: number; colorClass?: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 py-2.5 border-b border-slate-100 ${bold ? 'bg-slate-50' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-slate-700' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm tabular-nums font-${bold ? 'bold' : 'medium'} ${colorClass ?? 'text-slate-700'}`}>
        {formatCurrency(monto)}
      </span>
    </div>
  )
}

export default function RliClient({ empresa_id, anio, resumen: initialResumen }: Props) {
  const router = useRouter()
  const [resumen, setResumen] = useState(initialResumen)
  const [tasa, setTasa] = useState(initialResumen.tasa)
  const [tipo, setTipo] = useState<'agrega' | 'deduce'>('agrega')
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!concepto.trim() || !monto) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch('/api/rli/ajuste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id, anio, tipo, concepto: concepto.trim(), monto: Number(monto) }),
      })
      const json = await res.json()
      if (!json.ok) { setError(json.error ?? 'Error'); return }
      setConcepto('')
      setMonto('')
      router.refresh()
    } catch { setError('Error de conexión') }
    finally { setAdding(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch('/api/rli/ajuste', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, empresa_id }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); return }
    router.refresh()
  }

  const impuestoConTasa = resumen.rli > 0 ? resumen.rli * tasa : 0
  const agregados = resumen.ajustes.filter((a) => a.tipo === 'agrega')
  const deducidos = resumen.ajustes.filter((a) => a.tipo === 'deduce')

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Cálculo RLI */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Cálculo RLI — Ejercicio {anio}</h2>
          <select
            value={tasa}
            onChange={(e) => setTasa(Number(e.target.value))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TASAS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <Linea label="Resultado Contable del Ejercicio" monto={resumen.resultado_contable}
          colorClass={resumen.resultado_contable >= 0 ? 'text-green-700' : 'text-red-700'} />
        <Linea label="(+) Total Agregados" monto={resumen.total_agrega} colorClass="text-orange-700" />
        <Linea label="(−) Total Deducidos" monto={resumen.total_deduce} colorClass="text-blue-700" />

        <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-b-2 border-blue-200">
          <span className="text-sm font-bold text-blue-900">Renta Líquida Imponible (RLI)</span>
          <span className={`text-base font-bold tabular-nums ${resumen.rli >= 0 ? 'text-blue-900' : 'text-red-700'}`}>
            {formatCurrency(resumen.rli)}
          </span>
        </div>

        <div className="flex items-center justify-between px-5 py-3 bg-slate-50">
          <span className="text-sm text-slate-600">
            Impuesto 1ª Categoría ({(tasa * 100).toFixed(0)}%)
          </span>
          <span className={`text-sm font-bold tabular-nums ${impuestoConTasa > 0 ? 'text-red-700' : 'text-slate-500'}`}>
            {formatCurrency(impuestoConTasa)}
          </span>
        </div>
      </div>

      {/* Ajustes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Agregados */}
        <AjustesTable
          titulo="Agregados (+)"
          items={agregados}
          colorClass="text-orange-700"
          onDelete={handleDelete}
        />
        {/* Deducidos */}
        <AjustesTable
          titulo="Deducidos (−)"
          items={deducidos}
          colorClass="text-blue-700"
          onDelete={handleDelete}
        />
      </div>

      {/* Formulario nuevo ajuste */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Agregar ajuste</h3>
        </div>
        <form onSubmit={handleAdd} className="flex items-end gap-3 px-5 py-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as 'agrega' | 'deduce')}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="agrega">Agrega (+)</option>
              <option value="deduce">Deduce (−)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-48">
            <label className="text-xs text-slate-500">Concepto</label>
            <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)}
              placeholder="Descripción del ajuste"
              required
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Monto</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
              placeholder="0"
              required min="0" step="1"
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={adding}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
            {adding ? 'Guardando...' : 'Agregar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AjustesTable({ titulo, items, colorClass, onDelete }: {
  titulo: string
  items: RliAjuste[]
  colorClass: string
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${colorClass}`}>{titulo}</span>
        <span className="text-xs text-slate-400">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-xs text-slate-400">Sin ajustes registrados.</p>
      ) : (
        items.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-2 border-b border-slate-50 hover:bg-slate-50 group">
            <span className="text-xs text-slate-600 flex-1 truncate">{a.concepto}</span>
            <span className={`text-xs font-medium tabular-nums ml-3 ${colorClass}`}>{formatCurrency(a.monto)}</span>
            <button
              onClick={() => onDelete(a.id)}
              className="ml-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-xs"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  )
}
