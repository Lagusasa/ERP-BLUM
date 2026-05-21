import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentasBancarias } from '@/services/finanzas.service'
import NuevoMovimientoClient from '@/components/finanzas/NuevoMovimientoClient'

export const metadata: Metadata = { title: 'Nuevo Movimiento' }

export default async function NuevoMovimientoPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null
  const cuentas = await getCuentasBancarias(empresa.id)
  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">Nuevo Movimiento</h1>
      <NuevoMovimientoClient empresa_id={empresa.id} cuentas={cuentas} />
    </div>
  )
}
