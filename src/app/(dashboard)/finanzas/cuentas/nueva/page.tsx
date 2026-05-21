import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import NuevaCuentaClient from '@/components/finanzas/NuevaCuentaClient'

export const metadata: Metadata = { title: 'Nueva Cuenta Bancaria' }

export default async function NuevaCuentaPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null
  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">Nueva Cuenta Bancaria</h1>
      <NuevaCuentaClient empresa_id={empresa.id} />
    </div>
  )
}
