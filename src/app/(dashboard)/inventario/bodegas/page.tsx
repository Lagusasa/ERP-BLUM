import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getBodegas } from '@/services/inventario.service'
import BodegasClient from '@/components/inventario/BodegasClient'

export const metadata: Metadata = { title: 'Bodegas' }

export default async function BodegasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const bodegas = await getBodegas(empresa.id)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Bodegas</h1>
      <BodegasClient bodegas={bodegas} empresa_id={empresa.id} />
    </div>
  )
}
