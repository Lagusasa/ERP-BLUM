import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getActivosFijos, getCuentasImputables } from '@/services/contabilidad.service'
import ActivosFijosClient from '@/components/contabilidad/ActivosFijosClient'

export const metadata: Metadata = { title: 'Activos Fijos' }

export default async function ActivosFijosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [activos, cuentas] = await Promise.all([
    getActivosFijos(empresa.id),
    getCuentasImputables(empresa.id),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Activos Fijos</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Registro y depreciación según tablas SII (método lineal y acelerado).
        </p>
      </div>
      <ActivosFijosClient activos={activos} cuentas={cuentas} />
    </div>
  )
}
