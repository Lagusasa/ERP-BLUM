import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getPresupuestoVsReal } from '@/services/contabilidad.service'
import PresupuestoClient from '@/components/contabilidad/PresupuestoClient'

export const metadata: Metadata = { title: 'Presupuesto vs Real' }

interface Props {
  searchParams: Promise<{ anio?: string }>
}

export default async function PresupuestoPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const anio = Number(params.anio ?? new Date().getFullYear())

  const lineas = await getPresupuestoVsReal(empresa.id, anio)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Presupuesto vs Real</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Contraste de presupuesto con movimientos contables aprobados por cuenta.
        </p>
      </div>
      <PresupuestoClient lineas={lineas} anio={anio} />
    </div>
  )
}
