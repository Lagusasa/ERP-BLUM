import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getProductos, getBodegas, getMovimientos } from '@/services/inventario.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TIPO_MOVIMIENTO_LABELS } from '@/types/inventario.types'

export const metadata: Metadata = { title: 'Inventario' }

export default async function InventarioPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [productos, bodegas, movimientos] = await Promise.all([
    getProductos(empresa.id),
    getBodegas(empresa.id),
    getMovimientos(empresa.id),
  ])

  const totalProductos = productos.length
  const stockBajo = productos.filter((p) => {
    const totalStock = (p.stock ?? []).reduce((s, sb) => s + sb.cantidad, 0)
    return totalStock <= p.stock_minimo && p.tipo !== 'servicio'
  }).length
  const valorInventario = productos.reduce((total, p) => {
    const stock = (p.stock ?? []).reduce((s, sb) => s + sb.cantidad * sb.costo_prom, 0)
    return total + stock
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">Productos, stock y movimientos de bodega.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventario/productos/nuevo"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo producto
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Productos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalProductos}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Bodegas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{bodegas.length}</p>
        </div>
        <Link href="/inventario/alertas"
          className={`border rounded-xl p-4 transition-all hover:shadow-sm ${stockBajo > 0 ? 'bg-amber-50 border-amber-200 hover:border-amber-400' : 'bg-white border-slate-200'}`}>
          <p className={`text-xs uppercase tracking-wide ${stockBajo > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Stock bajo mínimo</p>
          <p className={`text-2xl font-bold mt-1 ${stockBajo > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{stockBajo}</p>
          {stockBajo > 0 && <p className="text-xs text-amber-500 mt-0.5">Ver alertas →</p>}
        </Link>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Valor inventario</p>
          <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatCurrency(valorInventario)}</p>
        </div>
      </div>

      {/* Navegación rápida */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { href: '/inventario/productos', label: 'Productos', desc: 'Ver catálogo completo' },
          { href: '/inventario/kardex', label: 'Kardex / Movimientos', desc: 'Entradas, salidas y ajustes' },
          { href: '/inventario/bodegas', label: 'Bodegas', desc: 'Gestión de ubicaciones' },
          { href: '/inventario/alertas', label: 'Alertas de Stock', desc: 'Productos bajo mínimo' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all">
            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Últimos movimientos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Últimos movimientos</h2>
          <Link href="/inventario/kardex" className="text-xs text-emerald-700 hover:underline">Ver todos →</Link>
        </div>
        {movimientos.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">Sin movimientos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Producto</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Cantidad</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Stock final</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.slice(0, 10).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-slate-800">{m.producto?.nombre ?? '—'}</p>
                    <p className="text-xs text-slate-400">{m.producto?.sku}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.tipo === 'entrada' ? 'bg-green-100 text-green-700' :
                      m.tipo === 'salida' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {TIPO_MOVIMIENTO_LABELS[m.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sm">
                    {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-sm font-medium">{m.stock_resultante}</td>
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
