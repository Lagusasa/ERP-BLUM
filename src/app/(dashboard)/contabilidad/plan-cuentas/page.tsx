import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentas } from '@/services/contabilidad.service'
import PlanCuentasClient from '@/components/contabilidad/PlanCuentasClient'
import ImportarPlanButton from '@/components/contabilidad/ImportarPlanButton'

export const metadata: Metadata = { title: 'Plan de Cuentas' }

export default async function PlanCuentasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const cuentas = await getCuentas(empresa.id).catch(() => [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Plan de Cuentas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cuentas.length} cuentas — {empresa.razon_social}
          </p>
        </div>
        <div className="flex gap-2">
          {cuentas.length === 0 && (
            <ImportarPlanButton empresa_id={empresa.id} />
          )}
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Cuenta
          </button>
        </div>
      </div>

      <PlanCuentasClient cuentas={cuentas} />
    </div>
  )
}
