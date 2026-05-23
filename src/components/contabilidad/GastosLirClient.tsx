'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanCuenta } from '@/types/contabilidad.types'

interface GastoLir {
  id: string
  fecha: string
  anio: number
  concepto: string
  monto: number
  articulo: '31' | '21'
  tipo_gasto: string | null
  rut_beneficiario: string | null
  nombre_beneficiario: string | null
  cuenta_id: string | null
}

interface Props {
  empresa_id: string
  cuentas: PlanCuenta[]
}

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const TIPOS_ART31 = [
  'Remuneraciones y honorarios',
  'Arriendos',
  'Intereses y gastos financieros',
  'Depreciación y amortización',
  'Seguros',
  'Publicidad y propaganda',
  'Gastos de movilización y viáticos',
  'Asesorías y servicios',
  'Suministros y materiales',
  'Pérdidas por caso fortuito',
  'Donaciones (con límite)',
  'Otros gastos necesarios',
]

const TIPOS_ART21 = [
  'Retiros en especie',
  'Préstamos a socios/accionistas',
  'Gastos de auto particular',
  'Viajes y gastos recreativos no necesarios',
  'Multas y sanciones',
  'Regalías excesivas a relacionados',
  'Gastos no documentados',
  'Intereses a relacionados en exceso',
  'Otros gastos rechazados',
]

const EMPTY_FORM = {
  fecha: new Date().toISOString().split('T')[0],
  concepto: '',
  monto: '',
  articulo: '31' as '31' | '21',
  tipo_gasto: '',
  rut_beneficiario: '',
  nombre_beneficiario: '',
  cuenta_id: '',
}

export default function GastosLirClient({ empresa_id, cuentas }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual)
  const [gastos, setGastos] = useState<GastoLir[]>([])
  const [mostrando, setMostrando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [tabActivo, setTabActivo] = useState<'31' | '21' | 'todos'>('todos')

  useEffect(() => {
    setCargando(true)
    fetch(`/api/contabilidad/gastos-lir?empresa_id=${empresa_id}&anio=${anio}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setGastos(d.data) })
      .finally(() => setCargando(false))
  }, [empresa_id, anio])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/contabilidad/gastos-lir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, ...form, monto: Number(form.monto) }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.ok) { setError(json.error ?? 'Error'); return }
    setGastos((prev) => [json.data, ...prev])
    setMostrando(false)
    setForm(EMPTY_FORM)
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/contabilidad/gastos-lir?id=${id}`, { method: 'DELETE' })
    setGastos((prev) => prev.filter((g) => g.id !== id))
  }

  const gastosFiltrados = gastos.filter((g) => tabActivo === 'todos' || g.articulo === tabActivo)
  const totalArt31 = gastos.filter((g) => g.articulo === '31').reduce((s, g) => s + g.monto, 0)
  const totalArt21 = gastos.filter((g) => g.articulo === '21').reduce((s, g) => s + g.monto, 0)
  const tiposActuales = form.articulo === '31' ? TIPOS_ART31 : TIPOS_ART21

  return (
    <div className="space-y-4">
      {/* Referencia normativa */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Art. 31 LIR — Gastos Necesarios</p>
          <p className="text-xs text-blue-600">Gastos que se rebajan de la renta bruta: son inevitables, necesarios para producir la renta y debidamente acreditados con documentación.</p>
          <p className="text-lg font-bold text-blue-800 mt-2 tabular-nums">{CLP(totalArt31)}</p>
          <p className="text-xs text-blue-500">Total {anio}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Art. 21 LIR — Gastos Rechazados</p>
          <p className="text-xs text-red-600">Gastos no necesarios que quedan afectos a impuesto único 40% (SA) o global complementario (EIRL/SpA). No deducibles de la RLI.</p>
          <p className="text-lg font-bold text-red-700 mt-2 tabular-nums">{CLP(totalArt21)}</p>
          <p className="text-xs text-red-500">Total {anio} — Afecto impuesto art. 21</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {[anioActual, anioActual - 1, anioActual - 2].map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          {(['todos', '31', '21'] as const).map((t) => (
            <button key={t} onClick={() => setTabActivo(t)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${tabActivo === t ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {t === 'todos' ? 'Todos' : `Art. ${t}`}
            </button>
          ))}
        </div>
        <button onClick={() => setMostrando(true)}
          className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg">
          + Registrar gasto
        </button>
      </div>

      {/* Formulario */}
      {mostrando && (
        <form onSubmit={guardar} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Registrar gasto LIR</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Artículo</label>
              <select value={form.articulo} onChange={set('articulo')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="31">Art. 31 — Necesario</option>
                <option value="21">Art. 21 — Rechazado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Fecha</label>
              <input required type="date" value={form.fecha} onChange={set('fecha')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Monto</label>
              <input required type="number" min="0" step="1" value={form.monto} onChange={set('monto')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Tipo de gasto</label>
              <select value={form.tipo_gasto} onChange={set('tipo_gasto')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Seleccionar…</option>
                {tiposActuales.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Concepto / descripción</label>
            <input required value={form.concepto} onChange={set('concepto')}
              placeholder="Descripción del gasto"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Cuenta contable</label>
              <select value={form.cuenta_id} onChange={set('cuenta_id')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">— Sin cuenta —</option>
                {cuentas.filter((c) => c.clase === 'gasto' || c.clase === 'costo').map((c) => (
                  <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">RUT beneficiario</label>
              <input value={form.rut_beneficiario} onChange={set('rut_beneficiario')}
                placeholder="12.345.678-9"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Nombre beneficiario</label>
              <input value={form.nombre_beneficiario} onChange={set('nombre_beneficiario')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
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
          <h2 className="text-sm font-semibold text-slate-700">Gastos registrados ({gastosFiltrados.length})</h2>
          {cargando && <span className="text-xs text-slate-400">Cargando…</span>}
        </div>
        {gastosFiltrados.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">No hay gastos registrados para {anio}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Art.</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Concepto</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Monto</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gastosFiltrados.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-xs text-slate-500">{g.fecha}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${g.articulo === '31' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      Art. {g.articulo}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 text-xs">{g.concepto}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{g.tipo_gasto ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">{CLP(g.monto)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => eliminar(g.id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={4} className="px-5 py-2.5 text-sm font-semibold text-slate-700">Total filtrado</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">
                  {CLP(gastosFiltrados.reduce((s, g) => s + g.monto, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
