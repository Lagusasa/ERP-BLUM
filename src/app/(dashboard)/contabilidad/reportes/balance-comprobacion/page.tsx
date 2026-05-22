import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getBalanceComprobacion } from '@/services/contabilidad.service'
import { ReportePeriodo } from '@/components/contabilidad/ReporteLayout'
import BalanceComprobacionClient from '@/components/contabilidad/BalanceComprobacionClient'

export const metadata: Metadata = { title: 'Balance de 8 Columnas' }

interface Props {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}

export default async function BalanceComprobacionPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const ahora = new Date()
  const desde = params.desde ?? `${ahora.getFullYear()}-01-01`
  const hasta = params.hasta ?? ahora.toISOString().split('T')[0]

  const lineas = await getBalanceComprobacion(empresa.id, desde, hasta)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Balance de Comprobación y Saldos (8 columnas)</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hoja de trabajo: sumas, saldos, balance e inventario de resultados.</p>
      </div>
      <ReportePeriodo desde={desde} hasta={hasta}>
        <BalanceComprobacionClient lineas={lineas} />
      </ReportePeriodo>
    </div>
  )
}
