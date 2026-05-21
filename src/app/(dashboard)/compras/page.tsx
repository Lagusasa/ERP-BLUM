import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDocumentosCompra, getProveedores, getResumenIVACompras } from '@/services/compras.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ESTADO_COMPRA_LABELS } from '@/types/compras.types'

export const metadata: Metadata = { title: 'Compras' }

export default async function ComprasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const ahora = new Date()

  const [documentos, proveedores, resumenIVA] = await Promise.allSettled([
    getDocumentosCompra({ empresa_id: empresa.id }),
    getProveedores(empresa.id),
    getResumenIVACompras(empresa.id, ahora.getFullYear(), ahora.getMonth() + 1),
  ])

  const listaDoc = documentos.status === 'fulfilled' ? documentos.value.slice(0, 10) : []
  const cantProveedores = proveedores.status === 'fulfilled' ? proveedores.value.filter((p) => p.is_active).length : 0
  const iva = resumenIVA.status === 'fulfilled' ? resumenIVA.value : { total_neto: 0, total_iva: 0, total: 0, cantidad: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Compras</h1>
          <p className="text-sm text-slate-500 mt-0.5">Documentos de compra y proveedores</p>
        </div>
        <Link href="/compras/documentos/nuevo"
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Documento
        </Link>
      </div>

      {/* KPIs del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Compras Neto</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatCurrency(iva.total_neto)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{ahora.toLocaleString('es-CL', { month: 'long' })}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">IVA Crédito Fiscal</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(iva.total_iva)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{iva.cantidad} documentos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Compras</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(iva.total)}</p>
          <p className="text-xs text-slate-400 mt-0.5">bruto con IVA</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Proveedores</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{cantProveedores}</p>
          <p className="text-xs text-slate-400 mt-0.5">activos</p>
        </div>
      </div>

      {/* Últimos documentos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Últimos Documentos de Compra</h2>
          <Link href="/compras/documentos" className="text-xs text-emerald-700 hover:underline">Ver todos →</Link>
        </div>
        {listaDoc.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No hay documentos registrados.</p>
            <Link href="/compras/documentos/nuevo" className="mt-2 inline-block text-sm text-emerald-700 hover:underline">
              Registrar primer documento →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Proveedor</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Documento</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Neto</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listaDoc.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5">
                    <p className="font-medium text-slate-800 text-xs">{d.proveedor?.razon_social ?? '—'}</p>
                    <p className="text-xs text-slate-400">{d.proveedor?.rut}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {d.tipo_documento?.abreviatura} N° {d.numero_documento}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{formatDate(d.fecha_emision)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.neto)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.iva)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums">{formatCurrency(d.total)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <EstadoBadge estado={d.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700',
    contabilizado: 'bg-emerald-100 text-emerald-800',
    pagado: 'bg-green-100 text-green-700',
    anulado: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[estado] ?? 'bg-slate-100 text-slate-600'}`}>
      {ESTADO_COMPRA_LABELS[estado as keyof typeof ESTADO_COMPRA_LABELS] ?? estado}
    </span>
  )
}
