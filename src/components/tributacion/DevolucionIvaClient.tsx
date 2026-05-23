'use client'

import { useState, useEffect } from 'react'

interface SolicitudDevolucion {
  id: string
  periodo: string
  monto_iva_exportaciones: number
  monto_solicitado: number
  numero_solicitud: string | null
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'pagada'
  observacion: string | null
  created_at: string
}

interface Props { empresa_id: string }

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const ESTADO_COLORS = {
  pendiente: 'bg-amber-100 text-amber-700',
  aprobada:  'bg-blue-100 text-blue-700',
  rechazada: 'bg-red-100 text-red-700',
  pagada:    'bg-green-100 text-green-700',
}

const EMPTY_FORM = {
  periodo: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  monto_iva_exportaciones: '',
  monto_solicitado: '',
  numero_solicitud: '',
  observacion: '',
}

export default function DevolucionIvaClient({ empresa_id }: Props) {
  const [solicitudes, setSolicitudes] = useState<SolicitudDevolucion[]>([])
  const [mostrando, setMostrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    fetch(`/api/tributacion/devolucion-iva?empresa_id=${empresa_id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setSolicitudes(d.data) })
  }, [empresa_id])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/tributacion/devolucion-iva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, ...form }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.ok) { setError(json.error ?? 'Error'); return }
    setSolicitudes((prev) => [json.data, ...prev])
    setMostrando(false)
    setForm(EMPTY_FORM)
  }

  async function cambiarEstado(id: string, estado: SolicitudDevolucion['estado']) {
    const res = await fetch('/api/tributacion/devolucion-iva', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    const json = await res.json()
    if (json.ok) setSolicitudes((prev) => prev.map((s) => s.id === id ? { ...s, estado } : s))
  }

  const totalPendiente = solicitudes.filter((s) => s.estado === 'pendiente').reduce((a, s) => a + s.monto_solicitado, 0)
  const totalPagado = solicitudes.filter((s) => s.estado === 'pagada').reduce((a, s) => a + s.monto_solicitado, 0)

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Art. 36 Ley IVA:</strong> Los exportadores tienen derecho a solicitar devolución del IVA soportado en adquisiciones
        destinadas a exportaciones. Se presenta Formulario 3600 en el SII. El plazo de resolución es de 20 días hábiles.
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Solicitudes pendientes</p>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{CLP(totalPendiente)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">Total recuperado</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{CLP(totalPagado)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase">N° solicitudes</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{solicitudes.length}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setMostrando(true)}
          className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg">
          + Nueva solicitud
        </button>
      </div>

      {mostrando && (
        <form onSubmit={guardar} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Nueva solicitud devolución IVA (F-3600)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Período (YYYY-MM)</label>
              <input required value={form.periodo} onChange={set('periodo')} placeholder="2024-03"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">IVA exportaciones</label>
              <input required type="number" step="1" min="0" value={form.monto_iva_exportaciones} onChange={set('monto_iva_exportaciones')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Monto solicitado</label>
              <input required type="number" step="1" min="0" value={form.monto_solicitado} onChange={set('monto_solicitado')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">N° solicitud SII</label>
              <input value={form.numero_solicitud} onChange={set('numero_solicitud')} placeholder="Opcional"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Observaciones</label>
            <input value={form.observacion} onChange={set('observacion')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Guardando…' : 'Registrar solicitud'}
            </button>
            <button type="button" onClick={() => setMostrando(false)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Historial de solicitudes</h2>
        </div>
        {solicitudes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">Sin solicitudes registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Período</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">N° SII</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA export.</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Solicitado</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {solicitudes.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 font-medium text-slate-800">{s.periodo}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{s.numero_solicitud ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{CLP(s.monto_iva_exportaciones)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">{CLP(s.monto_solicitado)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ESTADO_COLORS[s.estado]}`}>
                      {s.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {s.estado === 'pendiente' && (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => cambiarEstado(s.id, 'aprobada')} className="text-xs text-blue-600 hover:underline">Aprobar</button>
                        <span className="text-slate-300">|</span>
                        <button onClick={() => cambiarEstado(s.id, 'pagada')} className="text-xs text-emerald-600 hover:underline">Pagada</button>
                        <span className="text-slate-300">|</span>
                        <button onClick={() => cambiarEstado(s.id, 'rechazada')} className="text-xs text-red-500 hover:underline">Rechazar</button>
                      </div>
                    )}
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
