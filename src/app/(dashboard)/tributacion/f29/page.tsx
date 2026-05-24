import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getEmpresaActiva } from '@/lib/empresa'
import { getResumenIVA, getDeclaracionesF29 } from '@/services/tributacion.service'
import { formatCurrency } from '@/lib/utils'
import PeriodoSelector from '@/components/tributacion/PeriodoSelector'
import F29Client from '@/components/tributacion/F29Client'

export const metadata: Metadata = { title: 'Declaración F29' }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface PageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>
}

function FilaF29({ label, valor, destacado = false }: { label: string; valor: number; destacado?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 px-4 ${destacado ? 'bg-slate-50 font-bold' : 'border-b border-slate-100'}`}>
      <span className={`text-sm ${destacado ? 'text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${destacado ? 'text-slate-900' : 'text-slate-800'}`}>{formatCurrency(valor)}</span>
    </div>
  )
}

export default async function F29Page({ searchParams }: PageProps) {
  const params = await searchParams
  const now = new Date()
  const mes = parseInt(params.mes ?? '') || (now.getMonth() + 1)
  const anio = parseInt(params.anio ?? '') || now.getFullYear()

  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [resumen, declaraciones] = await Promise.all([
    getResumenIVA(empresa.id, mes, anio),
    getDeclaracionesF29(empresa.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h2 className="text-sm font-semibold text-slate-700">Formulario 29 — Período</h2>
        <Suspense>
          <PeriodoSelector mes={mes} anio={anio} basePath="/tributacion/f29" />
        </Suspense>
      </div>

      <div className="hidden print:block mb-4">
        <h2 className="text-lg font-bold text-slate-900">Formulario 29 — Pre-liquidación IVA</h2>
        <p className="text-sm text-slate-600">{MESES[mes - 1]} {anio}</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Sección débito */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-800">
            <p className="text-sm font-semibold text-white">Débito Fiscal (IVA en Ventas)</p>
          </div>
          <FilaF29 label="IVA en ventas afectas" valor={resumen.debito_fiscal} />
          <FilaF29 label="Total Débito Fiscal" valor={resumen.debito_fiscal} destacado />
        </div>

        {/* Sección crédito */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-800">
            <p className="text-sm font-semibold text-white">Crédito Fiscal (IVA en Compras)</p>
          </div>
          <FilaF29 label="IVA en compras" valor={resumen.credito_fiscal} />
          <FilaF29 label="Total Crédito Fiscal" valor={resumen.credito_fiscal} destacado />
        </div>

        {/* Resultado */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-800">
            <p className="text-sm font-semibold text-white">Determinación del IVA</p>
          </div>
          <FilaF29 label="Débito Fiscal" valor={resumen.debito_fiscal} />
          <FilaF29 label="Crédito Fiscal" valor={resumen.credito_fiscal} />
          {resumen.iva_a_pagar > 0 ? (
            <div className="flex items-center justify-between py-3 px-4 bg-red-50">
              <span className="text-sm font-bold text-red-800">IVA a Pagar</span>
              <span className="text-lg font-bold text-red-700 tabular-nums">{formatCurrency(resumen.iva_a_pagar)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between py-3 px-4 bg-green-50">
              <span className="text-sm font-bold text-green-800">Remanente Crédito Fiscal</span>
              <span className="text-lg font-bold text-green-700 tabular-nums">{formatCurrency(resumen.remanente)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-800 font-medium mb-1">Información F29 — {MESES[mes - 1]} {anio}</p>
          <p className="text-xs text-emerald-700">
            Esta es una pre-liquidación calculada automáticamente desde los documentos registrados.
            El vencimiento para la declaración y pago es el día 12 del mes siguiente.
            Para presentar la declaración oficial, accede al portal del SII.
          </p>
        </div>

        {/* Acciones + historial (client) */}
        <F29Client
          resumen={resumen}
          empresa_id={empresa.id}
          declaraciones={declaraciones}
          mes={mes}
          anio={anio}
        />
      </div>
    </div>
  )
}
