import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getPeriodos } from '@/services/contabilidad.service'
import PeriodosClient from '@/components/contabilidad/PeriodosClient'

export const metadata: Metadata = { title: 'Períodos Contables' }

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default async function PeriodosPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>
}) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
      Selecciona una empresa para gestionar los períodos contables.
    </div>
  )

  const params = await searchParams
  const anio = params.anio ? Number(params.anio) : new Date().getFullYear()

  const periodos = await getPeriodos(empresa.id, anio)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Períodos Contables</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gestiona la apertura y cierre de períodos mensuales.</p>
      </div>

      <PeriodosClient
        empresa_id={empresa.id}
        periodos={periodos}
        anio={anio}
        meses={MESES}
      />
    </div>
  )
}
