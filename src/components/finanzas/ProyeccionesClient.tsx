'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, CATEGORIA_LABELS } from '@/types/finanzas.types'
import type { ProyeccionCaja, MovimientoCaja } from '@/types/finanzas.types'

interface Props {
  proyecciones: ProyeccionCaja[]
  movimientos: MovimientoCaja[]
  empresa_id: string
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function ProyeccionesClient({ proyecciones, movimientos, empresa_id }: Props) {
  const router = useRouter()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso')
  const [categoria, setCategoria] = useState('cobranza_clientes')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [recurrente, setRecurrente] = useState(false)

  function cancelar() {
    setMostrarForm(false)
    setDescripcion('')
    setMonto('')
    setTipo('ingreso')
    setCategoria('cobranza_clientes')
    setRecurrente(false)
    setError(null)
  }

  async function guardar() {
    if (!descripcion.trim() || !monto || !fecha) { setError('Completa todos los campos requeridos'); return }
    setGuardando(true); setError(null)
    try {
      const res = await fetch('/api/finanzas/proyecciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id, tipo, categoria, descripcion, monto: parseFloat(monto), fecha, es_recurrente: recurrente }),
      })
      const d = await res.json()
      if (!d.ok) throw new Error(d.error)
      cancelar()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setGuardando(false) }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar esta proyección?')) return
    setEliminando(id)
    try {
      const res = await fetch('/api/finanzas/proyecciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const d = await res.json()
      if (!d.ok) setError(d.error)
      else router.refresh()
    } finally { setEliminando(null) }
  }

  // Calcular resumen por mes (próximos 6 meses)
  const hoy = new Date()
  const mesesProximos = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1)
    return { anio: d.getFullYear(), mes: d.getMonth() + 1 }
  })

  function isoMes(anio: number, mes: number) {
    return `${anio}-${String(mes).padStart(2, '0')}`
  }

  const resumenMeses = mesesProximos.map(({ anio, mes }) => {
    const prefijo = isoMes(anio, mes)
    const proyIngresos = proyecciones.filter((p) => p.fecha.startsWith(prefijo) && p.tipo === 'ingreso').reduce((s, p) => s + p.monto, 0)
    const proyEgresos  = proyecciones.filter((p) => p.fecha.startsWith(prefijo) && p.tipo === 'egreso').reduce((s, p) => s + p.monto, 0)
    const realIngresos = movimientos.filter((m) => m.fecha.startsWith(prefijo) && m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
    const realEgresos  = movimientos.filter((m) => m.fecha.startsWith(prefijo) && m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
    return { anio, mes, proyIngresos, proyEgresos, realIngresos, realEgresos }
  })

  const categorias = tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Tabla resumen mensual */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Flujo Proyectado — Próximos 6 meses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Mes</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-green-600">Ingr. Proyect.</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400">Ingr. Real</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-red-600">Egr. Proyect.</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400">Egr. Real</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-700">Flujo Neto Proy.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resumenMeses.map(({ anio, mes, proyIngresos, proyEgresos, realIngresos, realEgresos }) => {
                const flujoNeto = proyIngresos - proyEgresos
                const esActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1
                return (
                  <tr key={`${anio}-${mes}`} className={cn('hover:bg-slate-50', esActual && 'bg-emerald-50/30')}>
                    <td className="px-5 py-2.5 text-sm font-medium text-slate-800">
                      {MESES[mes - 1]} {anio}
                      {esActual && <span className="ml-2 text-xs text-emerald-600 font-normal">actual</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-medium text-green-700 tabular-nums">{formatCurrency(proyIngresos)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-400 tabular-nums">{realIngresos > 0 ? formatCurrency(realIngresos) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-medium text-red-600 tabular-nums">{formatCurrency(proyEgresos)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-slate-400 tabular-nums">{realEgresos > 0 ? formatCurrency(realEgresos) : '—'}</td>
                    <td className={cn('px-5 py-2.5 text-right text-sm font-bold tabular-nums', flujoNeto >= 0 ? 'text-green-700' : 'text-red-700')}>
                      {flujoNeto >= 0 ? '+' : ''}{formatCurrency(flujoNeto)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulario nueva proyección */}
      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Nueva proyección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {(['ingreso', 'egreso'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => { setTipo(t); setCategoria(t === 'ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]) }}
                    className={cn('flex-1 py-2 text-sm font-medium transition-colors', tipo === t ? (t === 'ingreso' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-white text-slate-600 hover:bg-slate-50')}>
                    {t === 'ingreso' ? 'Ingreso' : 'Egreso'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha <span className="text-red-500">*</span></label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {categorias.map((c) => <option key={c} value={c}>{CATEGORIA_LABELS[c] ?? c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Monto <span className="text-red-500">*</span></label>
              <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Descripción <span className="text-red-500">*</span></label>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="ej: Cobro cuota cliente ABC"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="recurrente" checked={recurrente} onChange={(e) => setRecurrente(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <label htmlFor="recurrente" className="text-sm text-slate-600">Es recurrente mensual</label>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={cancelar} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Agregar proyección'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de proyecciones */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Proyecciones registradas</h3>
          {!mostrarForm && (
            <button onClick={() => setMostrarForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva proyección
            </button>
          )}
        </div>
        {proyecciones.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">No hay proyecciones. Agrega una para visualizar el flujo proyectado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Descripción</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Categoría</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Recurrente</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Monto</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proyecciones.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(p.fecha)}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-800">{p.descripcion}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{CATEGORIA_LABELS[p.categoria] ?? p.categoria}</td>
                  <td className="px-4 py-2.5 text-center text-xs">{p.es_recurrente ? '↺ Sí' : '—'}</td>
                  <td className={cn('px-4 py-2.5 text-right text-sm font-medium tabular-nums', p.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600')}>
                    {p.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(p.monto)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => eliminar(p.id)} disabled={eliminando === p.id}
                      className="text-xs px-2 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors disabled:opacity-50">
                      {eliminando === p.id ? '...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
