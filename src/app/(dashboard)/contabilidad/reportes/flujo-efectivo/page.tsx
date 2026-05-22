import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getFlujoCaja } from '@/services/contabilidad.service'
import { ReportePeriodo } from '@/components/contabilidad/ReporteLayout'
import FlujoCajaClient from '@/components/contabilidad/FlujoCajaClient'

export const metadata: Metadata = { title: 'Estado de Flujo de Efectivo' }

interface Props {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}

export default async function FlujoCajaPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const ahora = new Date()
  const desde = params.desde ?? `${ahora.getFullYear()}-01-01`
  const hasta = params.hasta ?? ahora.toISOString().split('T')[0]

  const data = await getFlujoCaja(empresa.id, desde, hasta)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Estado de Flujo de Efectivo</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Método directo — movimientos de tesorería por actividad.
        </p>
      </div>
      <ReportePeriodo desde={desde} hasta={hasta}>
        <FlujoCajaClient data={data} />
      </ReportePeriodo>
    </div>
  )
}
