'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Cliente } from '@/types/compras.types'
import { formatRut, formatCurrency, cn } from '@/lib/utils'

interface Props {
  clientes: Cliente[]
  empresa_id: string
}

export default function ClientesClient({ clientes, empresa_id }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const filtrados = useMemo(() => {
    const termino = busqueda.toLowerCase()
    return clientes.filter((c) => {
      const activo = !soloActivos || c.is_active
      const coincide =
        !busqueda ||
        c.razon_social.toLowerCase().includes(termino) ||
        c.rut.includes(termino) ||
        (c.email ?? '').toLowerCase().includes(termino)
      return activo && coincide
    })
  }, [clientes, busqueda, soloActivos])

  return (
    <div className="space-y-4">
      {/* Header con botón */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clientes.filter((c) => c.is_active).length} clientes activos</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <NuevoClienteForm
          empresa_id={empresa_id}
          onCancel={() => setShowForm(false)}
          onSave={() => { setShowForm(false); router.refresh() }}
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
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Límite Crédito</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  {clientes.length === 0 ? (
                    <span>
                      No hay clientes.{' '}
                      <button onClick={() => setShowForm(true)} className="text-emerald-700 hover:underline">
                        Agregar primero →
                      </button>
                    </span>
                  ) : 'No se encontraron resultados.'}
                </td>
              </tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatRut(c.rut)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{c.razon_social}</p>
                    {c.nombre_fantasia && <p className="text-xs text-slate-400">{c.nombre_fantasia}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{c.giro ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-xs text-slate-600">
                    {c.limite_credito ? formatCurrency(c.limite_credito) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                      {c.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
          {filtrados.length} de {clientes.length} clientes
        </div>
      </div>
    </div>
  )
}

function NuevoClienteForm({ empresa_id, onCancel, onSave }: { empresa_id: string; onCancel: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    rut: '', razon_social: '', nombre_fantasia: '', giro: '',
    email: '', telefono: '', direccion: '', comuna: '', ciudad: '',
    limite_credito: '', condicion_pago: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/ventas/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa_id, ...form }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(false); return }
    onSave()
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-slate-800">Nuevo Cliente</h3>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">RUT *</label>
            <input required value={form.rut} onChange={set('rut')} placeholder="76.543.210-K"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
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
            <input value={form.giro} onChange={set('giro')} placeholder="Comercio al por menor"
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Límite de Crédito</label>
            <input type="number" min="0" value={form.limite_credito} onChange={set('limite_credito')} placeholder="0"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Condición de Pago</label>
            <select value={form.condicion_pago} onChange={set('condicion_pago')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">— Seleccionar —</option>
              <option value="contado">Contado</option>
              <option value="30 días">30 días</option>
              <option value="60 días">60 días</option>
              <option value="90 días">90 días</option>
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
            {loading ? 'Guardando…' : 'Guardar Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
