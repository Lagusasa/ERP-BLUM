'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DteDocumento } from '@/types/sii.types'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Props {
  empresa_id: string
  boletas: DteDocumento[]
}

const IVA = 0.19

export default function BoletaElectronicaClient({ empresa_id, boletas }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [mostrando, setMostrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    folio: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    monto_total: '',          // El total es lo que paga el cliente (IVA incluido)
    afecta_iva: true,
    descripcion: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const total = Number(form.monto_total || 0)
  const neto = form.afecta_iva ? Math.round(total / (1 + IVA)) : total
  const iva = total - neto

  async function emitir(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/sii/dte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id,
        tipo_dte: '39',
        folio: Number(form.folio),
        rut_contraparte: '66666666-6',     // Boleta: contraparte genérica
        razon_social: 'Consumidor Final',
        fecha_emision: form.fecha_emision,
        monto_neto: neto,
        monto_iva: iva,
        monto_total: total,
        estado: 'pendiente',
        xml_raw: null,
        track_id: null,
        referencia_id: null,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.ok) { setError(json.error ?? 'Error'); return }
    setMostrando(false)
    setForm({ folio: '', fecha_emision: new Date().toISOString().split('T')[0], monto_total: '', afecta_iva: true, descripcion: '' })
    startTransition(() => router.refresh())
  }

  const totalBoletas = boletas.filter((b) => b.estado !== 'anulado').reduce((s, b) => s + b.monto_total, 0)

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Boletas emitidas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{boletas.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Vigentes</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{boletas.filter((b) => b.estado !== 'anulado').length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total ventas</p>
          <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(totalBoletas)}</p>
        </div>
      </div>

      <div className="flex justify-end print:hidden">
        <button
          onClick={() => setMostrando(true)}
          className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
        >
          + Nueva Boleta
        </button>
      </div>

      {/* Formulario */}
      {mostrando && (
        <form onSubmit={emitir} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Nueva Boleta Electrónica (Tipo 39)</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Folio</label>
              <input required type="number" min="1" value={form.folio} onChange={set('folio')}
                placeholder="Número de folio"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha emisión</label>
              <input required type="date" value={form.fecha_emision} onChange={set('fecha_emision')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Monto total (con IVA)</label>
            <input required type="number" min="1" step="1" value={form.monto_total} onChange={set('monto_total')}
              placeholder="Ej: 119000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <p className="text-xs text-slate-400 mt-1">Ingresa el total que paga el cliente (IVA incluido)</p>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="afecta_iva_b" checked={form.afecta_iva}
              onChange={(e) => setForm((f) => ({ ...f, afecta_iva: e.target.checked }))}
              className="w-4 h-4 text-emerald-700 border-slate-300 rounded" />
            <label htmlFor="afecta_iva_b" className="text-sm text-slate-700">Afecta IVA 19%</label>
          </div>

          {total > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Neto</span><span className="tabular-nums">{formatCurrency(neto)}</span>
              </div>
              {form.afecta_iva && (
                <div className="flex justify-between text-slate-500">
                  <span>IVA 19%</span><span className="tabular-nums">{formatCurrency(iva)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-1">
                <span>Total</span><span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {loading ? 'Emitiendo…' : 'Emitir Boleta'}
            </button>
            <button type="button" onClick={() => setMostrando(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Listado */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Boletas registradas</h2>
        </div>
        {boletas.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">No hay boletas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Folio</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Neto</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {boletas.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 font-medium text-slate-800">#{b.folio}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDate(b.fecha_emision)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      b.estado === 'aceptado' ? 'bg-green-100 text-green-700' :
                      b.estado === 'anulado'  ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {b.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatCurrency(b.monto_neto)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{formatCurrency(b.monto_iva)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">{formatCurrency(b.monto_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
