import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getProductos } from '@/services/inventario.service'
import { formatCurrency } from '@/lib/utils'
import { TIPO_PRODUCTO_LABELS } from '@/types/inventario.types'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const productos = await getProductos(empresa.id)

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
            No hay productos. <Link href="/inventario/productos/nuevo" className="text-emerald-700 hover:underline">Crear el primero →</Link>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => {
                const stockTotal = (p.stock ?? []).reduce((s, sb) => s + sb.cantidad, 0)
                const bajominimo = stockTotal <= p.stock_minimo && p.tipo !== 'servicio'
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{TIPO_PRODUCTO_LABELS[p.tipo]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatCurrency(p.precio_venta)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums text-sm font-medium ${bajominimo ? 'text-amber-600' : 'text-slate-800'}`}>
                      {stockTotal} {p.unidad?.codigo ?? ''}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">{p.stock_minimo}</td>
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
