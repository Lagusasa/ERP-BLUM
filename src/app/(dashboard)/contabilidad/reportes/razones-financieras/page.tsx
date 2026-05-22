import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getRazonesFinancieras } from '@/services/contabilidad.service'
import RazonesFinancierasClient from '@/components/contabilidad/RazonesFinancierasClient'

export const metadata: Metadata = { title: 'Razones Financieras' }

export default async function RazonesFinancierasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const data = await getRazonesFinancieras(empresa.id)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Razones Financieras</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Indicadores de liquidez, endeudamiento y rentabilidad acumulados al día de hoy.
        </p>
      </div>
      <RazonesFinancierasClient data={data} />
    </div>
  )
}
