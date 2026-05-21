import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import NuevoDteClient from '@/components/sii/NuevoDteClient'

export const metadata: Metadata = { title: 'Nuevo DTE' }

export default async function NuevoDtePage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null
  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">Registrar DTE</h1>
      <NuevoDteClient empresa_id={empresa.id} />
    </div>
  )
}
