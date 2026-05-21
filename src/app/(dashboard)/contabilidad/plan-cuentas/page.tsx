import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentas } from '@/services/contabilidad.service'
import PlanCuentasClient from '@/components/contabilidad/PlanCuentasClient'

export const metadata: Metadata = { title: 'Plan de Cuentas' }

export default async function PlanCuentasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
      Selecciona una empresa para ver el Plan de Cuentas.
    </div>
  )

  const cuentas = await getCuentas(empresa.id).catch(() => [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Plan de Cuentas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cuentas.length > 0
              ? `${cuentas.length} cuentas — ${empresa.razon_social}`
              : 'Sin cuentas configuradas'}
          </p>
        </div>
      </div>

      <PlanCuentasClient cuentas={cuentas} empresa_id={empresa.id} />
    </div>
  )
}
