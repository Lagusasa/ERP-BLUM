'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TipoDte } from '@/types/sii.types'
import { TIPO_DTE_LABELS } from '@/types/sii.types'

interface Props { empresa_id: string }

const IVA_RATE = 0.19

export default function NuevoDteClient({ empresa_id }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tipo_dte: '33' as TipoDte,
    folio: '',
    rut_contraparte: '',
    razon_social: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    monto_neto: '',
    afecta_iva: true,
    estado: 'pendiente',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const monto_iva = form.afecta_iva && form.monto_neto ? Math.round(Number(form.monto_neto) * IVA_RATE) : 0
  const monto_total = Number(form.monto_neto || 0) + monto_iva

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/sii/dte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id,
        tipo_dte: form.tipo_dte,
        folio: Number(form.folio),
        rut_contraparte: form.rut_contraparte,
        razon_social: form.razon_social || null,
        fecha_emision: form.fecha_emision,
        monto_neto: Number(form.monto_neto),
        monto_iva,
        monto_total,
        estado: form.estado,
        xml_raw: null,
        track_id: null,
        referencia_id: null,
      }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(false); return }
    router.push('/sii/dte')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo DTE</label>
          <select value={form.tipo_dte} onChange={set('tipo_dte')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {(Object.keys(TIPO_DTE_LABELS) as TipoDte[]).map((t) => (
              <option key={t} value={t}>{TIPO_DTE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Folio</label>
          <input required type="number" min="1" value={form.folio} onChange={set('folio')}
            placeholder="1"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">RUT Contraparte</label>
          <input required value={form.rut_contraparte} onChange={set('rut_contraparte')}
            placeholder="76.123.456-7"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
          <input value={form.razon_social} onChange={set('razon_social')}
            placeholder="Empresa S.A."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha emisión</label>
          <input required type="date" value={form.fecha_emision} onChange={set('fecha_emision')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select value={form.estado} onChange={set('estado')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="pendiente">Pendiente</option>
            <option value="aceptado">Aceptado SII</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Monto neto</label>
        <input required type="number" step="0.01" min="0" value={form.monto_neto} onChange={set('monto_neto')}
          placeholder="0"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="afecta_iva" checked={form.afecta_iva}
          onChange={(e) => setForm((f) => ({ ...f, afecta_iva: e.target.checked }))}
          className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
        <label htmlFor="afecta_iva" className="text-sm text-slate-700">Afecta IVA (19%)</label>
      </div>

      {/* Resumen montos */}
      {Number(form.monto_neto) > 0 && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Neto</span>
            <span className="tabular-nums font-medium">{Number(form.monto_neto).toLocaleString('es-CL', { style: 'currency', currency: 'USD' })}</span>
          </div>
          {form.afecta_iva && (
            <div className="flex justify-between text-slate-500">
              <span>IVA 19%</span>
              <span className="tabular-nums">{monto_iva.toLocaleString('es-CL', { style: 'currency', currency: 'USD' })}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-1">
            <span>Total</span>
            <span className="tabular-nums">{monto_total.toLocaleString('es-CL', { style: 'currency', currency: 'USD' })}</span>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {loading ? 'Guardando…' : 'Registrar DTE'}
        </button>
      </div>
    </form>
  )
}
