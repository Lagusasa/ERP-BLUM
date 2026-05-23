import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getTrabajadores } from '@/services/remuneraciones.service'
import VacacionesClient from '@/components/remuneraciones/VacacionesClient'

export const metadata: Metadata = { title: 'Vacaciones y Permisos' }

export default async function VacacionesPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const trabajadores = await getTrabajadores(empresa.id)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Vacaciones y Permisos</h2>
        <p className="text-sm text-slate-500 mt-0.5">Feriado legal, feriado progresivo, licencias médicas y permisos</p>
      </div>
      <VacacionesClient empresa_id={empresa.id} trabajadores={trabajadores} />
    </div>
  )
}
