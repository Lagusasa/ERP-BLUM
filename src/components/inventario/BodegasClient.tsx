'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Bodega } from '@/types/inventario.types'

interface Props {
  bodegas: Bodega[]
  empresa_id: string
}

export default function BodegasClient({ bodegas, empresa_id }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/inventario/bodegas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id, codigo: codigo.trim(), nombre: nombre.trim(), ubicacion: ubicacion.trim() || null }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Error')
      setCodigo(''); setNombre(''); setUbicacion('')
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400">✕</button>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva bodega
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Código *</label>
              <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nombre *</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Ubicación</label>
              <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg">
              {saving ? '...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {bodegas.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">No hay bodegas configuradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Código</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Nombre</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bodegas.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{b.codigo}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{b.nombre}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{b.ubicacion ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
