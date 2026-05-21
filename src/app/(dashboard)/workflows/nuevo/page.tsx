import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import NuevoWorkflowClient from '@/components/workflows/NuevoWorkflowClient'

export const metadata: Metadata = { title: 'Nuevo flujo de aprobación' }

export default async function NuevoWorkflowPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Nuevo flujo de aprobación</h1>
      <NuevoWorkflowClient empresa_id={empresa.id} />
    </div>
  )
}
