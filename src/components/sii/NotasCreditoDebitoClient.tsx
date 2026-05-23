'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DteDocumento, TipoDte } from '@/types/sii.types'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Props {
  empresa_id: string
  facturas: DteDocumento[]
  notas: DteDocumento[]
}

const TIPO_LABELS: Record<string, string> = {
  '61': 'Nota de Crédito',
  '56': 'Nota de Débito',
}

const MOTIVO_NC = [
  'Anulación total de documento',
  'Corrección de monto',
  'Devolución de mercadería',
  'Descuento comercial',
  'Bonificación',
  'Otro motivo',
]

const MOTIVO_ND = [
  'Aumento de precio acordado',
  'Interés por mora',
  'Flete no facturado',
  'Diferencia de precio',
  'Otro motivo',
]

const IVA = 0.19

export default function NotasCreditoDebitoClient({ empresa_id, facturas, notas }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [tab, setTab] = useState<'61' | '56'>('61')
  const [mostrando, setMostrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tipo_dte: '61' as '61' | '56',
    folio: '',
    referencia_id: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    monto_neto: '',
    afecta_iva: true,
    motivo: '',
    rut_contraparte: '',
    razon_social: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const neto = Number(form.monto_neto || 0)
  const iva = form.afecta_iva ? Math.round(neto * IVA) : 0
  const total = neto + iva

  function seleccionarFactura(factura: DteDocumento) {
    setForm((f) => ({
      ...f,
      referencia_id: factura.id,
      rut_contraparte: factura.rut_contraparte,
      razon_social: factura.razon_social ?? '',
    }))
  }

  async function emitir(e: React.FormEvent) {
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
        monto_neto: neto,
        monto_iva: iva,
        monto_total: total,
        estado: 'pendiente',
        xml_raw: null,
        track_id: null,
        referencia_id: form.referencia_id || null,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.ok) { setError(json.error ?? 'Error'); return }
    setMostrando(false)
    startTransition(() => router.refresh())
  }

  const notasFiltradas = notas.filter((n) => n.tipo_dte === tab)
  const motivoOpts = tab === '61' ? MOTIVO_NC : MOTIVO_ND

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {(['61', '56'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setForm((f) => ({ ...f, tipo_dte: t })) }}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              tab === t
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {TIPO_LABELS[t]}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => { setMostrando(true); setForm((f) => ({ ...f, tipo_dte: tab })) }}
          className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
        >
          + Nueva {TIPO_LABELS[tab]}
        </button>
      </div>

      {/* Formulario */}
      {mostrando && (
        <form onSubmit={emitir} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Nueva {TIPO_LABELS[form.tipo_dte]}</h3>

          {/* Referencia a factura */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Factura de referencia (opcional)</label>
            <select value={form.referencia_id} onChange={set('referencia_id')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Sin referencia —</option>
              {facturas.filter((f) => f.estado !== 'anulado').map((f) => (
                <option key={f.id} value={f.id} onClick={() => seleccionarFactura(f)}>
                  Folio #{f.folio} — {f.razon_social ?? f.rut_contraparte} — {formatCurrency(f.monto_total)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Folio</label>
              <input required type="number" min="1" value={form.folio} onChange={set('folio')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha</label>
              <input required type="date" value={form.fecha_emision} onChange={set('fecha_emision')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">RUT contraparte</label>
              <input required value={form.rut_contraparte} onChange={set('rut_contraparte')}
                placeholder="76.123.456-7"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Razón social</label>
              <input value={form.razon_social} onChange={set('razon_social')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Monto neto</label>
              <input required type="number" step="1" min="0" value={form.monto_neto} onChange={set('monto_neto')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Motivo</label>
              <select value={form.motivo} onChange={set('motivo')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Seleccionar motivo…</option>
                {motivoOpts.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="afecta_nc" checked={form.afecta_iva}
              onChange={(e) => setForm((f) => ({ ...f, afecta_iva: e.target.checked }))}
              className="w-4 h-4 text-emerald-700 border-slate-300 rounded" />
            <label htmlFor="afecta_nc" className="text-sm text-slate-700">Afecta IVA 19%</label>
          </div>

          {neto > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600"><span>Neto</span><span className="tabular-nums">{formatCurrency(neto)}</span></div>
              {form.afecta_iva && <div className="flex justify-between text-slate-500"><span>IVA 19%</span><span className="tabular-nums">{formatCurrency(iva)}</span></div>}
              <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-1"><span>Total {tab === '61' ? 'a acreditar' : 'a debitar'}</span><span className="tabular-nums">{formatCurrency(total)}</span></div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {loading ? 'Emitiendo…' : `Emitir ${TIPO_LABELS[form.tipo_dte]}`}
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
          <h2 className="text-sm font-semibold text-slate-700">{TIPO_LABELS[tab]}s registradas ({notasFiltradas.length})</h2>
        </div>
        {notasFiltradas.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">No hay {TIPO_LABELS[tab].toLowerCase()}s registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Folio</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Contraparte</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notasFiltradas.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 font-medium text-slate-800">#{n.folio}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(n.fecha_emision)}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{n.razon_social ?? n.rut_contraparte}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      n.estado === 'aceptado' ? 'bg-green-100 text-green-700' :
                      n.estado === 'anulado'  ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-100 text-amber-700'
                    }`}>{n.estado}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">{formatCurrency(n.monto_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
