'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SiiConfig } from '@/types/sii.types'

interface Props {
  empresa_id: string
  config: SiiConfig | null
}

export default function SiiConfigClient({ empresa_id, config }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    rut_empresa: config?.rut_empresa ?? '',
    razon_social: config?.razon_social ?? '',
    ambiente: config?.ambiente ?? 'certificacion',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/sii/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, ...form, actividades: config?.actividades ?? [] }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(false); return }
    setSaved(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">RUT Empresa</label>
        <input required value={form.rut_empresa} onChange={set('rut_empresa')}
          placeholder="76.000.000-0"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-slate-400 mt-1">RUT con guión, sin puntos.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
        <input required value={form.razon_social} onChange={set('razon_social')}
          placeholder="Mi Empresa S.A."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Ambiente SII</label>
        <select value={form.ambiente} onChange={set('ambiente')}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="certificacion">Certificación (pruebas)</option>
          <option value="produccion">Producción</option>
        </select>
        {form.ambiente === 'produccion' && (
          <p className="text-xs text-amber-600 mt-1">Los DTEs emitidos en producción tienen validez tributaria legal.</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Integración real con SII</p>
        <p className="text-xs text-blue-700">La emisión real de DTE requiere certificado digital y conexión a los web services del SII. Esta versión registra los documentos manualmente para control interno.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Configuración guardada correctamente.</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {loading ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </form>
  )
}
