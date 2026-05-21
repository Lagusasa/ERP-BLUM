'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { MovimientoInventario, Producto, Bodega } from '@/types/inventario.types'
import { TIPO_MOVIMIENTO_LABELS } from '@/types/inventario.types'
import { formatDate, cn } from '@/lib/utils'

interface Props {
  movimientos: MovimientoInventario[]
  productos: Producto[]
  bodegas: Bodega[]
  empresa_id: string
}

export default function KardexClient({ movimientos, productos, bodegas, empresa_id }: Props) {
  const router = useRouter()
  const [filtroProducto, setFiltroProducto] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    if (!filtroProducto) return movimientos
    return movimientos.filter((m) => m.producto_id === filtroProducto)
  }, [movimientos, filtroProducto])

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {showForm && (
        <MovimientoForm
          empresa_id={empresa_id}
          productos={productos}
          bodegas={bodegas}
          onSuccess={() => { setShowForm(false); router.refresh() }}
          onCancel={() => setShowForm(false)}
          onError={setError}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <select value={filtroProducto} onChange={(e) => setFiltroProducto(e.target.value)}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Todos los productos</option>
            {productos.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>)}
          </select>
          <button onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Movimiento
          </button>
        </div>

        {filtrados.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">Sin movimientos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Producto</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Bodega</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Cantidad</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Stock</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Glosa</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-slate-800 text-xs">{m.producto?.nombre ?? '—'}</p>
                    <p className="text-xs text-slate-400">{m.producto?.sku}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{m.bodega?.nombre ?? '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', {
                      'bg-green-100 text-green-700': m.tipo === 'entrada',
                      'bg-red-100 text-red-700': m.tipo === 'salida',
                      'bg-slate-100 text-slate-600': m.tipo === 'ajuste' || m.tipo === 'traslado',
                    })}>
                      {TIPO_MOVIMIENTO_LABELS[m.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sm font-medium">
                    {m.tipo === 'salida' ? <span className="text-red-600">-{m.cantidad}</span> : <span className="text-green-600">+{m.cantidad}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sm">{m.stock_resultante}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">{m.glosa ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

interface FormProps {
  empresa_id: string
  productos: Producto[]
  bodegas: Bodega[]
  onSuccess: () => void
  onCancel: () => void
  onError: (msg: string) => void
}

function MovimientoForm({ empresa_id, productos, bodegas, onSuccess, onCancel, onError }: FormProps) {
  const [producto_id, setProductoId] = useState('')
  const [bodega_id, setBodegaId] = useState(bodegas[0]?.id ?? '')
  const [tipo, setTipo] = useState<'entrada' | 'salida' | 'ajuste'>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [costo, setCosto] = useState('0')
  const [glosa, setGlosa] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!producto_id || !bodega_id) { onError('Selecciona producto y bodega'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/inventario/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id, producto_id, bodega_id, tipo,
          cantidad: Number(cantidad),
          costo_unitario: Number(costo),
          glosa: glosa.trim() || null,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Error')
      onSuccess()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Registrar movimiento</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as 'entrada' | 'salida' | 'ajuste')}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Producto *</label>
          <select value={producto_id} onChange={(e) => setProductoId(e.target.value)} required
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Seleccionar...</option>
            {productos.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Bodega *</label>
          <select value={bodega_id} onChange={(e) => setBodegaId(e.target.value)} required
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {bodegas.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Cantidad *</label>
          <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required min="0.001" step="0.001"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Costo unit. (USD)</label>
          <input type="number" value={costo} onChange={(e) => setCosto(e.target.value)} min="0" step="0.0001"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="block text-xs text-slate-500 mb-1">Glosa</label>
          <input type="text" value={glosa} onChange={(e) => setGlosa(e.target.value)} placeholder="Descripción del movimiento"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="col-span-2 md:col-span-3 flex justify-end gap-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={saving}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg">
            {saving ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
