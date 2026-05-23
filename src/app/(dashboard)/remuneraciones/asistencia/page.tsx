import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getTrabajadores } from '@/services/remuneraciones.service'
import AsistenciaClient from '@/components/remuneraciones/AsistenciaClient'

export const metadata: Metadata = { title: 'Control de Asistencia' }

export default async function AsistenciaPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const trabajadores = await getTrabajadores(empresa.id)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Control de Asistencia</h2>
        <p className="text-sm text-slate-500 mt-0.5">Registro de jornada, horas extra y ausencias</p>
      </div>
      <AsistenciaClient empresa_id={empresa.id} trabajadores={trabajadores} />
    </div>
  )
}
