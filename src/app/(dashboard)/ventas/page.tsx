import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDocumentosVenta, getClientes, getResumenIVAVentas } from '@/services/ventas.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ESTADO_VENTA_LABELS } from '@/types/compras.types'

export const metadata: Metadata = { title: 'Ventas' }

export default async function VentasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const ahora = new Date()

  const [documentos, clientes, resumenIVA] = await Promise.allSettled([
    getDocumentosVenta({ empresa_id: empresa.id }),
    getClientes(empresa.id),
    getResumenIVAVentas(empresa.id, ahora.getFullYear(), ahora.getMonth() + 1),
  ])

  const listaDoc = documentos.status === 'fulfilled' ? documentos.value.slice(0, 10) : []
  const cantClientes = clientes.status === 'fulfilled' ? clientes.value.filter((c) => c.is_active).length : 0
  const iva = resumenIVA.status === 'fulfilled' ? resumenIVA.value : { total_neto: 0, total_iva: 0, total: 0, cantidad: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ventas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Documentos de venta y clientes</p>
        </div>
        <Link href="/ventas/documentos/nuevo"
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Documento
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Ventas Neto</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(iva.total_neto)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{ahora.toLocaleString('es-CL', { month: 'long' })}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">IVA Débito Fiscal</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(iva.total_iva)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{iva.cantidad} documentos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Ventas</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(iva.total)}</p>
          <p className="text-xs text-slate-400 mt-0.5">bruto con IVA</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Clientes</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{cantClientes}</p>
          <p className="text-xs text-slate-400 mt-0.5">activos</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Últimos Documentos de Venta</h2>
          <Link href="/ventas/documentos" className="text-xs text-emerald-700 hover:underline">Ver todos →</Link>
        </div>
        {listaDoc.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">No hay documentos registrados.</p>
            <Link href="/ventas/documentos/nuevo" className="mt-2 inline-block text-sm text-emerald-700 hover:underline">
              Registrar primer documento →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Cliente</th>
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
                    <p className="font-medium text-slate-800 text-xs">{d.cliente?.razon_social ?? '—'}</p>
                    <p className="text-xs text-slate-400">{d.cliente?.rut}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {d.tipo_documento?.abreviatura} N° {d.numero_documento}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{formatDate(d.fecha_emision)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.neto)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.iva)}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums">{formatCurrency(d.total)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.estado === 'emitido' ? 'bg-emerald-100 text-emerald-800' :
                      d.estado === 'contabilizado' ? 'bg-purple-100 text-purple-700' :
                      d.estado === 'cobrado' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ESTADO_VENTA_LABELS[d.estado]}
                    </span>
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
