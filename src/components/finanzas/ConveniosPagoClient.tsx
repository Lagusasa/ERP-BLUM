'use client'

import { useState, useEffect } from 'react'

interface Cuota {
  id: string
  numero: number
  fecha_vencimiento: string
  monto: number
  estado: 'pendiente' | 'pagada' | 'vencida'
  fecha_pago: string | null
}

interface Convenio {
  id: string
  acreedor: string
  tipo: 'sii' | 'tgr' | 'proveedor' | 'banco' | 'otro'
  monto_total: number
  n_cuotas: number
  monto_cuota: number
  fecha_inicio: string
  tasa_interes: number
  descripcion: string | null
  estado: 'vigente' | 'terminado' | 'incumplido'
  cuotas: Cuota[]
}

interface Props { empresa_id: string }

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const TIPO_LABELS = { sii: 'SII', tgr: 'TGR', proveedor: 'Proveedor', banco: 'Banco', otro: 'Otro' }
const TIPO_COLORS = {
  sii:       'bg-red-100 text-red-700',
  tgr:       'bg-orange-100 text-orange-700',
  proveedor: 'bg-blue-100 text-blue-700',
  banco:     'bg-purple-100 text-purple-700',
  otro:      'bg-slate-100 text-slate-600',
}

const EMPTY_FORM = {
  acreedor: '', tipo: 'proveedor', monto_total: '', n_cuotas: '', fecha_inicio: new Date().toISOString().split('T')[0], tasa_interes: '0', descripcion: '',
}

export default function ConveniosPagoClient({ empresa_id }: Props) {
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [expandido, setExpandido] = useState<string | null>(null)
  const [mostrando, setMostrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    fetch(`/api/finanzas/convenios?empresa_id=${empresa_id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setConvenios(d.data) })
  }, [empresa_id])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/finanzas/convenios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, ...form }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.ok) { setError(json.error ?? 'Error'); return }
    setMostrando(false)
    setForm(EMPTY_FORM)
    fetch(`/api/finanzas/convenios?empresa_id=${empresa_id}`)
      .then((r) => r.json()).then((d) => { if (d.ok) setConvenios(d.data) })
  }

  async function pagarCuota(cuota_id: string, convenio_id: string) {
    await fetch('/api/finanzas/convenios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuota_id, accion: 'pagar' }),
    })
    setConvenios((prev) => prev.map((c) =>
      c.id !== convenio_id ? c : {
        ...c,
        cuotas: c.cuotas.map((q) => q.id === cuota_id ? { ...q, estado: 'pagada' as const, fecha_pago: new Date().toISOString().split('T')[0] } : q),
      }
    ))
  }

  const totalDeuda = convenios.filter((c) => c.estado === 'vigente').reduce((s, c) => {
    const pendiente = c.cuotas.filter((q) => q.estado !== 'pagada').reduce((ss, q) => ss + q.monto, 0)
    return s + pendiente
  }, 0)

  const proximasVencer = convenios.flatMap((c) => c.cuotas.filter((q) => q.estado === 'pendiente')).sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)).slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Deuda total vigente</p>
          <p className="text-xl font-bold text-red-700 mt-1 tabular-nums">{CLP(totalDeuda)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Convenios activos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{convenios.filter((c) => c.estado === 'vigente').length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Próximo vencimiento</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{proximasVencer[0]?.fecha_vencimiento ?? '—'}</p>
          {proximasVencer[0] && <p className="text-xs text-slate-400">{CLP(proximasVencer[0].monto)}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setMostrando(true)}
          className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg">
          + Nuevo convenio
        </button>
      </div>

      {mostrando && (
        <form onSubmit={guardar} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Registrar convenio de pago</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs text-slate-500 block mb-1">Acreedor</label>
              <input required value={form.acreedor} onChange={set('acreedor')} placeholder="SII, Proveedor X…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Tipo</label>
              <select value={form.tipo} onChange={set('tipo')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Fecha inicio</label>
              <input required type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Monto total</label>
              <input required type="number" min="1" value={form.monto_total} onChange={set('monto_total')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">N° cuotas</label>
              <input required type="number" min="1" max="360" value={form.n_cuotas} onChange={set('n_cuotas')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Tasa interés mensual %</label>
              <input type="number" step="0.01" min="0" value={form.tasa_interes} onChange={set('tasa_interes')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          {form.monto_total && form.n_cuotas && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              Cuota mensual aproximada: <strong>{CLP(Math.round(Number(form.monto_total) / Number(form.n_cuotas)))}</strong>
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Guardando…' : 'Crear convenio'}
            </button>
            <button type="button" onClick={() => setMostrando(false)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {convenios.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">Sin convenios registrados.</div>
        ) : convenios.map((c) => {
          const cuotasPagadas = c.cuotas.filter((q) => q.estado === 'pagada').length
          const pct = Math.round((cuotasPagadas / c.cuotas.length) * 100)

          return (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center px-5 py-4 cursor-pointer" onClick={() => setExpandido(expandido === c.id ? null : c.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${TIPO_COLORS[c.tipo]}`}>{TIPO_LABELS[c.tipo]}</span>
                    <span className="font-semibold text-slate-800">{c.acreedor}</span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${c.estado === 'vigente' ? 'bg-green-100 text-green-700' : c.estado === 'terminado' ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-700'}`}>{c.estado}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Total: {CLP(c.monto_total)}</span>
                    <span>Cuotas: {cuotasPagadas}/{c.n_cuotas}</span>
                    <span>Desde: {c.fecha_inicio}</span>
                  </div>
                  <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <svg className={`w-4 h-4 text-slate-400 ml-4 transition-transform ${expandido === c.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {expandido === c.id && (
                <div className="border-t border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-5 py-2 text-xs font-medium text-slate-500">N°</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Vencimiento</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Monto</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Estado</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {c.cuotas.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50">
                          <td className="px-5 py-2 text-slate-700">#{q.numero}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{q.fecha_vencimiento}</td>
                          <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-800">{CLP(q.monto)}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${q.estado === 'pagada' ? 'bg-green-100 text-green-700' : q.estado === 'vencida' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {q.estado}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {q.estado === 'pendiente' && (
                              <button onClick={() => pagarCuota(q.id, c.id)} className="text-xs text-emerald-600 hover:underline">Marcar pagada</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
