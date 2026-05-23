'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Proveedor } from '@/types/compras.types'
import { formatRut, validateRut, cleanRut, cn } from '@/lib/utils'

interface Props {
  proveedores: Proveedor[]
  empresa_id: string
}

export default function ProveedoresClient({ proveedores, empresa_id }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const termino = busqueda.toLowerCase()
    return proveedores.filter((p) => {
      const activo = !soloActivos || p.is_active
      const coincide =
        !busqueda ||
        p.razon_social.toLowerCase().includes(termino) ||
        p.rut.includes(termino) ||
        (p.email ?? '').toLowerCase().includes(termino)
      return activo && coincide
    })
  }, [proveedores, busqueda, soloActivos])

  async function toggleActivo(id: string, current: boolean) {
    setToggling(id)
    await fetch('/api/compras/proveedores', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    setToggling(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proveedores</h1>
          <p className="text-sm text-slate-500 mt-0.5">{proveedores.filter((p) => p.is_active).length} proveedores activos</p>
        </div>
        <button onClick={() => { setEditando(null); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Proveedor
        </button>
      </div>

      {showForm && (
        <ProveedorForm empresa_id={empresa_id}
          onCancel={() => setShowForm(false)}
          onSave={() => { setShowForm(false); router.refresh() }}
        />
      )}

      {editando && (
        <ProveedorForm empresa_id={empresa_id} proveedor={editando}
          onCancel={() => setEditando(null)}
          onSave={() => { setEditando(null); router.refresh() }}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar por RUT, razón social o email..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} className="rounded border-slate-300" />
            Solo activos
          </label>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">RUT</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Razón Social</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Giro</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Email</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Teléfono</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  {proveedores.length === 0 ? (
                    <span>No hay proveedores.{' '}
                      <button onClick={() => setShowForm(true)} className="text-emerald-700 hover:underline">Agregar primero →</button>
                    </span>
                  ) : 'No se encontraron resultados.'}
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id} className={cn('hover:bg-slate-50 transition-colors', !p.is_active && 'opacity-60')}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatRut(p.rut)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{p.razon_social}</p>
                    {p.nombre_fantasia && <p className="text-xs text-slate-400">{p.nombre_fantasia}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{p.giro ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.email ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', p.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setShowForm(false); setEditando(p) }} title="Editar"
                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => toggleActivo(p.id, p.is_active)} disabled={toggling === p.id}
                        title={p.is_active ? 'Dar de baja' : 'Activar'}
                        className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors disabled:opacity-40">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          {p.is_active
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          }
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
          {filtrados.length} de {proveedores.length} proveedores
        </div>
      </div>
    </div>
  )
}

function ProveedorForm({
  empresa_id, proveedor, onCancel, onSave,
}: {
  empresa_id: string
  proveedor?: Proveedor
  onCancel: () => void
  onSave: () => void
}) {
  const isEdit = !!proveedor
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rutError, setRutError] = useState('')
  const [form, setForm] = useState({
    rut:             proveedor?.rut             ?? '',
    razon_social:    proveedor?.razon_social    ?? '',
    nombre_fantasia: proveedor?.nombre_fantasia ?? '',
    giro:            proveedor?.giro            ?? '',
    email:           proveedor?.email           ?? '',
    telefono:        proveedor?.telefono        ?? '',
    direccion:       proveedor?.direccion       ?? '',
    comuna:          proveedor?.comuna          ?? '',
    condicion_pago:  proveedor?.condicion_pago  ?? '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = cleanRut(e.target.value)
    const formatted = raw.length >= 2 ? formatRut(raw) : raw
    setForm(f => ({ ...f, rut: formatted }))
    setRutError('')
  }

  function handleRutBlur() {
    if (form.rut && !validateRut(form.rut)) {
      setRutError('RUT inválido')
    } else {
      setRutError('')
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEdit && !validateRut(form.rut)) {
      setRutError('RUT inválido — verifica el dígito verificador')
      return
    }
    setLoading(true); setError('')
    const condicion_pago = form.condicion_pago !== '' ? parseInt(form.condicion_pago as string, 10) : null
    const payload = { ...form, condicion_pago }
    const body = isEdit ? { id: proveedor!.id, ...payload } : { empresa_id, ...payload }
    const res = await fetch('/api/compras/proveedores', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(false); return }
    onSave()
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-slate-800">{isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">RUT *</label>
            <input required value={form.rut}
              onChange={handleRutChange}
              onBlur={handleRutBlur}
              placeholder="76.543.210-K"
              disabled={isEdit}
              className={cn(
                'w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100',
                rutError ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
              )} />
            {rutError && <p className="text-xs text-red-500 mt-0.5">{rutError}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social *</label>
            <input required value={form.razon_social} onChange={set('razon_social')} placeholder="Empresa S.A."
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Fantasía</label>
            <input value={form.nombre_fantasia} onChange={set('nombre_fantasia')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Giro</label>
            <input value={form.giro} onChange={set('giro')} placeholder="Comercio al por mayor"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set('email')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
            <input value={form.telefono} onChange={set('telefono')} placeholder="+56 9 1234 5678"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Dirección</label>
            <input value={form.direccion} onChange={set('direccion')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Comuna</label>
            <input value={form.comuna} onChange={set('comuna')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Condición de Pago</label>
            <select value={form.condicion_pago} onChange={set('condicion_pago')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">— Seleccionar —</option>
              <option value="0">Contado</option>
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {loading ? 'Guardando…' : isEdit ? 'Actualizar' : 'Guardar Proveedor'}
          </button>
        </div>
      </form>
    </div>
  )
}
