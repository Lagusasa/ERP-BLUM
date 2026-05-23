'use client'

import { useState, useEffect } from 'react'

type TipoRegistro = 'RAI' | 'DDAN' | 'FUT' | 'FUNT'

interface RegistroSii {
  id: string
  tipo: TipoRegistro
  anio: number
  concepto: string
  monto: number
  descripcion: string | null
  created_at: string
}

interface Props { empresa_id: string }

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const DESCRIPCIONES: Record<TipoRegistro, string> = {
  RAI:  'Registro de Rentas Afectas a Impuesto (art. 14 A LIR) — rentas acumuladas pendientes de tributación a nivel de propietarios.',
  DDAN: 'Diferencias entre Depreciación Normal y Acelerada — base imponible diferida por aceleración tributaria.',
  FUT:  'Fondo de Utilidades Tributables — vigente para empresas con FUT histórico acumulado pre-2017.',
  FUNT: 'Fondo de Utilidades No Tributables — utilidades exentas o con crédito total.',
}

const TIPO_COLORS: Record<TipoRegistro, string> = {
  RAI:  'bg-blue-100 text-blue-700',
  DDAN: 'bg-orange-100 text-orange-700',
  FUT:  'bg-purple-100 text-purple-700',
  FUNT: 'bg-green-100 text-green-700',
}

const EMPTY_FORM = { tipo: 'RAI' as TipoRegistro, anio: new Date().getFullYear(), concepto: '', monto: '', descripcion: '' }

export default function RegistrosEmpresaClient({ empresa_id }: Props) {
  const [registros, setRegistros] = useState<RegistroSii[]>([])
  const [tab, setTab] = useState<TipoRegistro | 'todos'>('todos')
  const [mostrando, setMostrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    setCargando(true)
    fetch(`/api/tributacion/registros-empresa?empresa_id=${empresa_id}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setRegistros(d.data) })
      .finally(() => setCargando(false))
  }, [empresa_id])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/tributacion/registros-empresa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, ...form }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.ok) { setError(json.error ?? 'Error'); return }
    setRegistros((prev) => [json.data, ...prev])
    setMostrando(false)
    setForm(EMPTY_FORM)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`/api/tributacion/registros-empresa?id=${id}`, { method: 'DELETE' })
    setRegistros((prev) => prev.filter((r) => r.id !== id))
  }

  const filtrados = registros.filter((r) => tab === 'todos' || r.tipo === tab)

  const resumenPorTipo = (['RAI', 'DDAN', 'FUT', 'FUNT'] as TipoRegistro[]).map((t) => ({
    tipo: t,
    total: registros.filter((r) => r.tipo === t).reduce((s, r) => s + r.monto, 0),
    count: registros.filter((r) => r.tipo === t).length,
  }))

  return (
    <div className="space-y-4">
      {/* Resumen tarjetas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {resumenPorTipo.map(({ tipo, total, count }) => (
          <div key={tipo} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${TIPO_COLORS[tipo]}`}>{tipo}</span>
            </div>
            <p className="text-lg font-bold text-slate-800 tabular-nums">{CLP(total)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{count} movimiento{count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {(['todos', 'RAI', 'DDAN', 'FUT', 'FUNT'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${tab === t ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setMostrando(true)}
          className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg">
          + Nuevo registro
        </button>
      </div>

      {/* Formulario */}
      {mostrando && (
        <form onSubmit={guardar} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Nuevo registro empresas SII</h3>

          {/* Descripción del tipo */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-xs text-slate-600">
            <strong>{form.tipo}:</strong> {DESCRIPCIONES[form.tipo as TipoRegistro]}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Tipo de registro</label>
              <select value={form.tipo} onChange={set('tipo')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="RAI">RAI</option>
                <option value="DDAN">DDAN</option>
                <option value="FUT">FUT</option>
                <option value="FUNT">FUNT</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Año tributario</label>
              <input type="number" min="2000" max="2099" value={form.anio}
                onChange={set('anio')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Monto</label>
              <input required type="number" step="1" value={form.monto} onChange={set('monto')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="col-span-1 md:col-span-1">
              <label className="text-xs text-slate-500 block mb-1">Concepto</label>
              <input required value={form.concepto} onChange={set('concepto')}
                placeholder="Ej: Utilidad acumulada período…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Descripción adicional (opcional)</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setMostrando(false)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Movimientos registrados ({filtrados.length})</h2>
          {cargando && <span className="text-xs text-slate-400">Cargando…</span>}
        </div>
        {filtrados.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">Sin registros. Agrega los movimientos del ejercicio.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Año</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Concepto</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Monto</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded ${TIPO_COLORS[r.tipo]}`}>{r.tipo}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{r.anio}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">
                    {r.concepto}
                    {r.descripcion && <p className="text-slate-400">{r.descripcion}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">{CLP(r.monto)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => eliminar(r.id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
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
