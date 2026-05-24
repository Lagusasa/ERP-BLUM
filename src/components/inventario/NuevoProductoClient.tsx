'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CategoriaProducto, Producto, TipoProducto, UnidadMedida } from '@/types/inventario.types'
import { TIPO_PRODUCTO_LABELS } from '@/types/inventario.types'

interface Props {
  empresa_id: string
  categorias: CategoriaProducto[]
  unidades: UnidadMedida[]
  producto?: Producto
}

export default function NuevoProductoClient({ empresa_id, categorias, unidades, producto }: Props) {
  const router = useRouter()
  const editando = !!producto

  const [form, setForm] = useState({
    sku:         producto?.sku ?? '',
    nombre:      producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    tipo:        (producto?.tipo ?? 'producto') as TipoProducto,
    categoria_id: producto?.categoria_id ?? '',
    unidad_id:   producto?.unidad_id ?? '',
    precio_compra: String(producto?.precio_compra ?? 0),
    precio_venta:  String(producto?.precio_venta ?? 0),
    stock_minimo:  String(producto?.stock_minimo ?? 0),
    afecto_iva:    producto?.afecto_iva ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const body = {
        sku: form.sku.trim(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        tipo: form.tipo,
        categoria_id: form.categoria_id || null,
        unidad_id: form.unidad_id || null,
        precio_compra: Number(form.precio_compra),
        precio_venta: Number(form.precio_venta),
        stock_minimo: Number(form.stock_minimo),
        afecto_iva: form.afecto_iva,
      }

      const res = await fetch('/api/inventario/productos', {
        method: editando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando ? { id: producto!.id, ...body } : { empresa_id, is_active: true, ...body }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Error al guardar')
      router.push('/inventario/productos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Información general</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">SKU *</label>
              <input type="text" value={form.sku} onChange={(e) => set('sku', e.target.value)} required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {Object.entries(TIPO_PRODUCTO_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Descripción</label>
            <input type="text" value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Categoría</label>
              <select value={form.categoria_id} onChange={(e) => set('categoria_id', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Sin categoría</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Unidad de medida</label>
              <select value={form.unidad_id} onChange={(e) => set('unidad_id', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Sin unidad</option>
                {unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo} — {u.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Precios y stock</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Precio compra</label>
              <input type="number" value={form.precio_compra} onChange={(e) => set('precio_compra', e.target.value)}
                min="0" step="0.01"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Precio venta</label>
              <input type="number" value={form.precio_venta} onChange={(e) => set('precio_venta', e.target.value)}
                min="0" step="0.01"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Stock mínimo</label>
              <input type="number" value={form.stock_minimo} onChange={(e) => set('stock_minimo', e.target.value)}
                min="0" step="0.01"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.afecto_iva} onChange={(e) => set('afecto_iva', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm text-slate-700">Afecto a IVA</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={guardando}
          className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {guardando ? 'Guardando...' : editando ? 'Actualizar producto' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}
