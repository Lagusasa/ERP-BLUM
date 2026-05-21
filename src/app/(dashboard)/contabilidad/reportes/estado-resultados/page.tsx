import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getEstadoResultados } from '@/services/contabilidad.service'
import { ReportePeriodo } from '@/components/contabilidad/ReporteLayout'
import EstadoResultadosClient from '@/components/contabilidad/EstadoResultadosClient'

export const metadata: Metadata = { title: 'Estado de Resultados' }

interface Props {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}

export default async function EstadoResultadosPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const ahora = new Date()
  const desde = params.desde ?? `${ahora.getFullYear()}-01-01`
  const hasta = params.hasta ?? ahora.toISOString().split('T')[0]

  const data = await getEstadoResultados(empresa.id, desde, hasta)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Estado de Resultados</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ingresos, costos y gastos del período — solo comprobantes aprobados.</p>
      </div>
      <ReportePeriodo desde={desde} hasta={hasta}>
        <EstadoResultadosClient data={data} />
      </ReportePeriodo>
    </div>
  )
}
