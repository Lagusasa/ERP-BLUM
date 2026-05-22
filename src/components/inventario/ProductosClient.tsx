'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Producto } from '@/types/inventario.types'
import { TIPO_PRODUCTO_LABELS } from '@/types/inventario.types'
import { formatCurrency, cn } from '@/lib/utils'

interface Props {
  productos: Producto[]
  empresa_id: string
}

export default function ProductosClient({ productos, empresa_id: _empresa_id }: Props) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)

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

  return (
    <div className="space-y-5">
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {productos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No hay productos.{' '}
            <Link href="/inventario/productos/nuevo" className="text-emerald-700 hover:underline">Crear el primero →</Link>
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
              {productos.map((p) => {
                const stockTotal = (p.stock ?? []).reduce((s, sb) => s + sb.cantidad, 0)
                const bajominimo = stockTotal <= p.stock_minimo && p.tipo !== 'servicio'
                return (
                  <tr key={p.id} className={cn('hover:bg-slate-50 transition-colors', !p.is_active && 'opacity-60')}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{TIPO_PRODUCTO_LABELS[p.tipo]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatCurrency(p.precio_venta)}</td>
                    <td className={cn('px-4 py-3 text-right tabular-nums text-sm font-medium', bajominimo ? 'text-amber-600' : 'text-slate-800')}>
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
