import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getTrabajadores } from '@/services/remuneraciones.service'
import TerminacionesClient from '@/components/remuneraciones/TerminacionesClient'

export const metadata: Metadata = { title: 'Terminación de Contratos' }

export default async function TerminacionesPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const trabajadores = await getTrabajadores(empresa.id)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Terminación de Contratos y Finiquitos</h2>
        <p className="text-sm text-slate-500 mt-0.5">Registro de causales (arts. 159, 160 y 161 CT), indemnizaciones y finiquitos</p>
      </div>
      <TerminacionesClient empresa_id={empresa.id} trabajadores={trabajadores} />
    </div>
  )
}
