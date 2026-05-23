'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ActivoFijo, CategoriaActivo, MetodoDepreciacion } from '@/types/activos_fijos.types'
import { CATEGORIA_LABELS, VIDA_UTIL_SII } from '@/types/activos_fijos.types'
import type { PlanCuenta } from '@/types/contabilidad.types'

const USD = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const EMPTY_FORM = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: 'maquinaria' as CategoriaActivo,
  fecha_adquisicion: '',
  valor_adquisicion: '',
  valor_residual: '0',
  vida_util_meses: '',
  metodo: 'lineal' as MetodoDepreciacion,
  cuenta_activo_id: '',
  cuenta_dep_acumulada_id: '',
  cuenta_gasto_dep_id: '',
  estado: 'activo' as const,
}

interface Props {
  activos: ActivoFijo[]
  cuentas: PlanCuenta[]
}

export default function ActivosFijosClient({ activos, cuentas }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editando, setEditando] = useState<ActivoFijo | null>(null)
  const [mostrando, setMostrando] = useState(false)
  const [depreciando, setDepreciando] = useState(false)
  const [error, setError] = useState('')

  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = ahora.getMonth() + 1

  function abrirNuevo() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setMostrando(true)
    setError('')
  }

  function abrirEditar(a: ActivoFijo) {
    setEditando(a)
    setForm({
      codigo: a.codigo,
      nombre: a.nombre,
      descripcion: a.descripcion ?? '',
      categoria: a.categoria,
      fecha_adquisicion: a.fecha_adquisicion,
      valor_adquisicion: String(a.valor_adquisicion),
      valor_residual: String(a.valor_residual),
      vida_util_meses: String(a.vida_util_meses),
      metodo: a.metodo,
      cuenta_activo_id: a.cuenta_activo_id ?? '',
      cuenta_dep_acumulada_id: a.cuenta_dep_acumulada_id ?? '',
      cuenta_gasto_dep_id: a.cuenta_gasto_dep_id ?? '',
      estado: a.estado as 'activo',
    })
    setMostrando(true)
    setError('')
  }

  function onCategoriaChange(cat: CategoriaActivo) {
    setForm((f) => ({ ...f, categoria: cat, vida_util_meses: String(VIDA_UTIL_SII[cat]) }))
  }

  async function guardar() {
    setError('')
    const payload = {
      ...form,
      valor_adquisicion: Number(form.valor_adquisicion),
      valor_residual: Number(form.valor_residual),
      vida_util_meses: Number(form.vida_util_meses),
      cuenta_activo_id: form.cuenta_activo_id || null,
      cuenta_dep_acumulada_id: form.cuenta_dep_acumulada_id || null,
      cuenta_gasto_dep_id: form.cuenta_gasto_dep_id || null,
      is_active: true,
    }
    const url = '/api/contabilidad/activos-fijos'
    const method = editando ? 'PATCH' : 'POST'
    const body = editando ? { id: editando.id, ...payload } : payload

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Error al guardar')
      return
    }
    setMostrando(false)
    startTransition(() => router.refresh())
  }

  async function depreciarMes() {
    setDepreciando(true)
    const res = await fetch('/api/contabilidad/activos-fijos/depreciar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anio, mes }),
    })
    setDepreciando(false)
    if (res.ok) {
      const d = await res.json()
      alert(`Depreciación registrada: ${d.registrados} activos / $${d.monto_total.toFixed(2)} total`)
      startTransition(() => router.refresh())
    } else {
      const d = await res.json()
      alert(`Error: ${d.error}`)
    }
  }

  const CuentaSelect = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <option value="">{placeholder}</option>
      {cuentas.map((c) => (
        <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
      ))}
    </select>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{activos.length} activo{activos.length !== 1 ? 's' : ''} registrado{activos.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-2">
          <button
            onClick={depreciarMes}
            disabled={depreciando || activos.length === 0}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {depreciando ? 'Procesando…' : `Depreciar ${mes}/${anio}`}
          </button>
          <button
            onClick={abrirNuevo}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            + Nuevo Activo
          </button>
        </div>
      </div>

      {/* Form */}
      {mostrando && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">{editando ? 'Editar Activo' : 'Nuevo Activo Fijo'}</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500">Código</label>
              <input value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500">Nombre</label>
              <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Categoría</label>
              <select value={form.categoria} onChange={(e) => onCategoriaChange(e.target.value as CategoriaActivo)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {(Object.keys(CATEGORIA_LABELS) as CategoriaActivo[]).map((k) => (
                  <option key={k} value={k}>{CATEGORIA_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500">Fecha adquisición</label>
              <input type="date" value={form.fecha_adquisicion} onChange={(e) => setForm((f) => ({ ...f, fecha_adquisicion: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Valor adquisición</label>
              <input type="number" value={form.valor_adquisicion} onChange={(e) => setForm((f) => ({ ...f, valor_adquisicion: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Valor residual</label>
              <input type="number" value={form.valor_residual} onChange={(e) => setForm((f) => ({ ...f, valor_residual: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Vida útil (meses)</label>
              <input type="number" value={form.vida_util_meses} onChange={(e) => setForm((f) => ({ ...f, vida_util_meses: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Método depreciación</label>
              <select value={form.metodo} onChange={(e) => setForm((f) => ({ ...f, metodo: e.target.value as MetodoDepreciacion }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="lineal">Lineal (art. 31 N°5)</option>
                <option value="acelerada">Acelerada — suma de dígitos</option>
                <option value="instantanea">Instantánea (art. 31 N°5 bis)</option>
              </select>
            </div>
            {editando && (
              <div>
                <label className="text-xs text-slate-500">Estado</label>
                <select value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as typeof form.estado }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="activo">Activo</option>
                  <option value="dado_baja">Dado de baja</option>
                  <option value="vendido">Vendido</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500">Cuenta activo</label>
              <CuentaSelect value={form.cuenta_activo_id} onChange={(v) => setForm((f) => ({ ...f, cuenta_activo_id: v }))} placeholder="— sin cuenta —" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Dep. acumulada</label>
              <CuentaSelect value={form.cuenta_dep_acumulada_id} onChange={(v) => setForm((f) => ({ ...f, cuenta_dep_acumulada_id: v }))} placeholder="— sin cuenta —" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Gasto depreciación</label>
              <CuentaSelect value={form.cuenta_gasto_dep_id} onChange={(v) => setForm((f) => ({ ...f, cuenta_gasto_dep_id: v }))} placeholder="— sin cuenta —" />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={guardar} disabled={isPending}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {editando ? 'Guardar cambios' : 'Crear activo'}
            </button>
            <button onClick={() => setMostrando(false)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Categoría</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Valor adq.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Dep. acum.</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Valor neto</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Método</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activos.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-sm text-slate-400">
                    No hay activos fijos registrados
                  </td>
                </tr>
              )}
              {activos.map((a) => {
                const depAcum = a.depreciacion_acumulada ?? 0
                const valorNeto = a.valor_adquisicion - depAcum
                const pctDep = a.valor_adquisicion > 0 ? (depAcum / a.valor_adquisicion) * 100 : 0
                return (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{CATEGORIA_LABELS[a.categoria]}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{USD(a.valor_adquisicion)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span>{USD(depAcum)}</span>
                      <span className="ml-1 text-xs text-slate-400">({pctDep.toFixed(0)}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{USD(valorNeto)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-slate-500 capitalize">{a.metodo}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.estado === 'activo' ? 'bg-emerald-50 text-emerald-700' :
                        a.estado === 'dado_baja' ? 'bg-red-50 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {a.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrirEditar(a)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
