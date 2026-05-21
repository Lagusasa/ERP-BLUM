import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getResumenIVA } from '@/services/tributacion.service'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Tributación — Resumen' }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default async function TributacionPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const now = new Date()
  const mes = now.getMonth() + 1
  const anio = now.getFullYear()
  const resumen = await getResumenIVA(empresa.id, mes, anio)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Período actual: <span className="font-medium text-slate-800">{MESES[mes - 1]} {anio}</span>
        </p>
      </div>

      {/* KPIs IVA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Débito Fiscal</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{formatCurrency(resumen.debito_fiscal)}</p>
          <p className="text-xs text-slate-400 mt-1">IVA en ventas</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Crédito Fiscal</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{formatCurrency(resumen.credito_fiscal)}</p>
          <p className="text-xs text-slate-400 mt-1">IVA en compras</p>
        </div>
        <div className={`border rounded-xl p-5 ${resumen.iva_a_pagar > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">IVA a Pagar</p>
          <p className={`text-2xl font-bold mt-2 tabular-nums ${resumen.iva_a_pagar > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {formatCurrency(resumen.iva_a_pagar)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Débito − Crédito</p>
        </div>
        <div className={`border rounded-xl p-5 ${resumen.remanente > 0 ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Remanente Crédito</p>
          <p className={`text-2xl font-bold mt-2 tabular-nums ${resumen.remanente > 0 ? 'text-green-700' : 'text-slate-900'}`}>
            {formatCurrency(resumen.remanente)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Crédito en exceso</p>
        </div>
      </div>

      {/* Resumen documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Libro IVA Compras</h3>
            <Link href={`/tributacion/libro-compras?mes=${mes}&anio=${anio}`} className="text-xs text-blue-600 hover:underline">
              Ver detalle →
            </Link>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Documentos</span>
            <span className="font-medium text-slate-800">{resumen.documentos_compra}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-500">Crédito IVA</span>
            <span className="font-medium text-slate-800 tabular-nums">{formatCurrency(resumen.credito_fiscal)}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Libro IVA Ventas</h3>
            <Link href={`/tributacion/libro-ventas?mes=${mes}&anio=${anio}`} className="text-xs text-blue-600 hover:underline">
              Ver detalle →
            </Link>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Documentos</span>
            <span className="font-medium text-slate-800">{resumen.documentos_venta}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-500">Débito IVA</span>
            <span className="font-medium text-slate-800 tabular-nums">{formatCurrency(resumen.debito_fiscal)}</span>
          </div>
        </div>
      </div>

      {/* Alerta vencimiento */}
      {resumen.iva_a_pagar > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">IVA pendiente de pago</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Debe pagar {formatCurrency(resumen.iva_a_pagar)} por concepto de IVA del mes de {MESES[mes - 1]}.
              El vencimiento es el día 12 del mes siguiente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
