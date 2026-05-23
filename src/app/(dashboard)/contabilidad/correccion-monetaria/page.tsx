import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentasImputables, getPeriodos } from '@/services/contabilidad.service'
import CorreccionMonetariaClient from '@/components/contabilidad/CorreccionMonetariaClient'

export const metadata: Metadata = { title: 'Corrección Monetaria' }

export default async function CorreccionMonetariaPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [cuentas, periodos] = await Promise.all([
    getCuentasImputables(empresa.id),
    getPeriodos(empresa.id),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Corrección Monetaria</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Ajuste de activos y pasivos no monetarios según variación UF (art. 41 LIR).
        </p>
      </div>
      <CorreccionMonetariaClient
        empresa_id={empresa.id}
        cuentas={cuentas}
        periodos={periodos}
      />
    </div>
  )
}
