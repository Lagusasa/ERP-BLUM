import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getProductos, getBodegas } from '@/services/inventario.service'
import { formatCurrency, cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Alertas de Stock — Inventario' }

export default async function AlertasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [productos, bodegas] = await Promise.all([
    getProductos(empresa.id),
    getBodegas(empresa.id),
  ])

  const alertas = productos
    .filter((p) => p.tipo !== 'servicio')
    .map((p) => {
      const stockTotal = (p.stock ?? []).reduce((s, sb) => s + sb.cantidad, 0)
      return { ...p, stockTotal, deficit: p.stock_minimo - stockTotal }
    })
    .filter((p) => p.stockTotal <= p.stock_minimo)
    .sort((a, b) => b.deficit - a.deficit)

  const sinStock    = alertas.filter((p) => p.stockTotal === 0)
  const bajoMinimo  = alertas.filter((p) => p.stockTotal > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alertas de Stock</h1>
          <p className="text-sm text-slate-500 mt-0.5">Productos por debajo del stock mínimo configurado.</p>
        </div>
        <Link href="/inventario" className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          ← Volver
        </Link>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-lg font-semibold text-green-800">Todo en orden</p>
          <p className="text-sm text-green-600 mt-1">Todos los productos tienen stock por encima del mínimo.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs text-red-700 font-medium">Sin stock</p>
              <p className="text-2xl font-bold text-red-800 mt-0.5">{sinStock.length}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium">Bajo mínimo</p>
              <p className="text-2xl font-bold text-amber-800 mt-0.5">{bajoMinimo.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">Total alertas</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{alertas.length}</p>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Productos con alerta</h3>
              <Link href="/inventario/kardex"
                className="flex items-center gap-1 text-xs text-emerald-700 hover:underline font-medium">
                Registrar entradas →
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">SKU / Nombre</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Stock actual</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Mínimo</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Déficit</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Valor stock</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Nivel</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alertas.map((p) => {
                  const sinStockP = p.stockTotal === 0
                  const valorStock = (p.stock ?? []).reduce((s, sb) => s + sb.cantidad * sb.costo_prom, 0)
                  const unidad = p.unidad?.codigo ?? ''
                  return (
                    <tr key={p.id} className={cn('hover:bg-slate-50', sinStockP && 'bg-red-50/30')}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{p.nombre}</p>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                      </td>
                      <td className={cn('px-4 py-3 text-right tabular-nums font-bold', sinStockP ? 'text-red-600' : 'text-amber-600')}>
                        {p.stockTotal} {unidad}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums">
                        {p.stock_minimo} {unidad}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-red-600 tabular-nums">
                        -{p.deficit} {unidad}
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-500">
                        {formatCurrency(valorStock)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                          sinStockP ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                          {sinStockP ? 'Sin stock' : 'Bajo mínimo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/inventario/kardex?producto=${p.id}`}
                          className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium transition-colors">
                          + Entrada
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {bodegas.length > 1 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500">
                Stock consolidado de {bodegas.length} bodegas: {bodegas.map((b) => b.nombre).join(', ')}.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
