'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ModuloWorkflow } from '@/types/workflows.types'
import { MODULO_WORKFLOW_LABELS } from '@/types/workflows.types'

interface Paso {
  nombre: string
  orden: number
  rol_requerido: string
}

interface Props { empresa_id: string }

export default function NuevoWorkflowClient({ empresa_id }: Props) {
  const router = useRouter()
  const [modulo, setModulo] = useState<ModuloWorkflow>('compras')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [montoMin, setMontoMin] = useState('')
  const [montoMax, setMontoMax] = useState('')
  const [pasos, setPasos] = useState<Paso[]>([
    { nombre: 'Aprobación Jefatura', orden: 1, rol_requerido: '' },
  ])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addPaso() {
    setPasos((prev) => [...prev, { nombre: '', orden: prev.length + 1, rol_requerido: '' }])
  }

  function removePaso(idx: number) {
    setPasos((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, orden: i + 1 })))
  }

  function updatePaso(idx: number, field: keyof Paso, value: string | number) {
    setPasos((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || pasos.some((p) => !p.nombre.trim())) {
      setError('El nombre del flujo y todos los pasos son requeridos')
      return
    }
    setGuardando(true)
    setError(null)

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          monto_min: montoMin ? Number(montoMin) : null,
          monto_max: montoMax ? Number(montoMax) : null,
          pasos: pasos.map((p) => ({
            nombre: p.nombre.trim(),
            orden: p.orden,
            rol_requerido: p.rol_requerido.trim() || null,
          })),
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Error al guardar')
      router.push('/workflows')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Información del flujo</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Módulo</label>
              <select value={modulo} onChange={(e) => setModulo(e.target.value as ModuloWorkflow)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(MODULO_WORKFLOW_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nombre</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Aprobación facturas compras" required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Descripción (opcional)</label>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Monto mínimo (USD)</label>
              <input type="number" value={montoMin} onChange={(e) => setMontoMin(e.target.value)}
                placeholder="0 = siempre aplica" min="0" step="0.01"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Monto máximo (USD)</label>
              <input type="number" value={montoMax} onChange={(e) => setMontoMax(e.target.value)}
                placeholder="Sin límite" min="0" step="0.01"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Pasos de aprobación</h2>
          <button type="button" onClick={addPaso}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            + Agregar paso
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {pasos.map((paso, idx) => (
            <div key={idx} className="px-5 py-3 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                {paso.orden}
              </span>
              <input type="text" value={paso.nombre}
                onChange={(e) => updatePaso(idx, 'nombre', e.target.value)}
                placeholder="Nombre del paso" required
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={paso.rol_requerido}
                onChange={(e) => updatePaso(idx, 'rol_requerido', e.target.value)}
                placeholder="Rol aprobador (opcional)"
                className="w-40 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {pasos.length > 1 && (
                <button type="button" onClick={() => removePaso(idx)}
                  className="text-slate-400 hover:text-red-500 text-sm">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={guardando}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors">
          {guardando ? 'Guardando...' : 'Crear flujo'}
        </button>
      </div>
    </form>
  )
}
