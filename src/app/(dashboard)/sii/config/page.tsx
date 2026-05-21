import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getSiiConfig } from '@/services/sii.service'
import SiiConfigClient from '@/components/sii/SiiConfigClient'

export const metadata: Metadata = { title: 'Configuración SII' }

export default async function SiiConfigPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null
  const config = await getSiiConfig(empresa.id)
  return (
    <div className="space-y-5 max-w-lg">
      <h1 className="text-xl font-bold text-slate-900">Configuración SII</h1>
      <SiiConfigClient empresa_id={empresa.id} config={config} />
    </div>
  )
}
