import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getBalanceGeneral } from '@/services/contabilidad.service'
import { ReporteFecha } from '@/components/contabilidad/ReporteLayout'
import BalanceGeneralClient from '@/components/contabilidad/BalanceGeneralClient'

export const metadata: Metadata = { title: 'Balance General' }

interface Props {
  searchParams: Promise<{ hasta?: string }>
}

export default async function BalanceGeneralPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const hasta = params.hasta ?? new Date().toISOString().split('T')[0]

  const data = await getBalanceGeneral(empresa.id, hasta)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Balance General</h1>
        <p className="text-sm text-slate-500 mt-0.5">Activos, pasivos y patrimonio acumulados hasta la fecha.</p>
      </div>
      <ReporteFecha hasta={hasta}>
        <BalanceGeneralClient data={data} />
      </ReporteFecha>
    </div>
  )
}
