import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getAFPs, getIsapres } from '@/services/remuneraciones.service'
import TrabajadorForm from '@/components/remuneraciones/TrabajadorForm'

export const metadata: Metadata = { title: 'Nuevo Trabajador' }

export default async function NuevoTrabajadorPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [afps, isapres] = await Promise.allSettled([getAFPs(), getIsapres()])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Registrar trabajador</h2>
        <p className="text-sm text-slate-500 mt-0.5">Datos personales, previsión y contrato</p>
      </div>
      <TrabajadorForm
        empresa_id={empresa.id}
        afps={afps.status === 'fulfilled' ? afps.value : []}
        isapres={isapres.status === 'fulfilled' ? isapres.value : []}
      />
    </div>
  )
}
