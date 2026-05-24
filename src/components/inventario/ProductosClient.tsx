'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/types/inventario.types'
import { TIPO_PRODUCTO_LABELS } from '@/types/inventario.types'
import { formatCurrency, cn } from '@/lib/utils'

interface Props {
  productos: Producto[]
  empresa_id: string
}

type FiltroStock = 'todos' | 'bajo' | 'sin'

export default function ProductosClient({ productos, empresa_id: _empresa_id }: Props) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroStock, setFiltroStock] = useState<FiltroStock>('todos')

  async function toggleActivo(id: string, current: boolean) {
    setToggling(id)
    await fetch('/api/inventario/productos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    setToggling(null)
    router.refresh()
  }

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return productos.filter((p) => {
      if (t && !p.nombre.toLowerCase().includes(t) && !p.sku.toLowerCase().includes(t)) return false
      const stock = (p.stock ?? []).reduce((s, sb) => s + sb.cantidad, 0)
      if (filtroStock === 'bajo' && (stock > p.stock_minimo || p.tipo === 'servicio')) return false
      if (filtroStock === 'sin' && stock > 0) return false
      return true
    })
  }, [productos, busqueda, filtroStock])

  const countBajo = useMemo(() => productos.filter((p) => {
    const s = (p.stock ?? []).reduce((acc, sb) => acc + sb.cantidad, 0)
    return p.tipo !== 'servicio' && s <= p.stock_minimo
  }).length, [productos])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Productos</h1>
        <Link href="/inventario/productos/nuevo"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar SKU o nombre..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
          {([['todos', 'Todos'], ['bajo', `Bajo mínimo (${countBajo})`], ['sin', 'Sin stock']] as [FiltroStock, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setFiltroStock(val)}
              className={cn('px-3 py-1.5 transition-colors whitespace-nowrap', filtroStock === val
                ? (val === 'bajo' ? 'bg-amber-500 text-white' : val === 'sin' ? 'bg-red-600 text-white' : 'bg-emerald-700 text-white')
                : 'bg-white text-slate-600 hover:bg-slate-50')}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">{filtrados.length} producto{filtrados.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            {productos.length === 0
              ? <><span>No hay productos. </span><Link href="/inventario/productos/nuevo" className="text-emerald-700 hover:underline">Crear el primero →</Link></>
              : 'Ningún producto coincide con los filtros.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">SKU / Nombre</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">P. Venta</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Stock total</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Mínimo</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((p) => {
                const stockTotal = (p.stock ?? []).reduce((s, sb) => s + sb.cantidad, 0)
                const bajominimo = stockTotal <= p.stock_minimo && p.tipo !== 'servicio'
                return (
                  <tr key={p.id} className={cn('hover:bg-slate-50 transition-colors', !p.is_active && 'opacity-60', bajominimo && 'bg-amber-50/40')}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{TIPO_PRODUCTO_LABELS[p.tipo]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatCurrency(p.precio_venta)}</td>
                    <td className={cn('px-4 py-3 text-right tabular-nums text-sm font-medium', bajominimo ? 'text-amber-600' : 'text-slate-800')}>
                      {bajominimo && <span className="mr-1 text-amber-500">⚠</span>}
                      {stockTotal} {p.unidad?.codigo ?? ''}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">{p.stock_minimo}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', p.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/inventario/productos/nuevo?edit=${p.id}`} title="Editar"
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
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
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
