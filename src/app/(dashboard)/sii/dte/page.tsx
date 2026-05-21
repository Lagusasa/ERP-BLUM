import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDteDocumentos } from '@/services/sii.service'
import DteListClient from '@/components/sii/DteListClient'

export const metadata: Metadata = { title: 'DTE — Documentos Tributarios' }

export default async function DtePage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const dtes = await getDteDocumentos(empresa.id)

  return <DteListClient empresa_id={empresa.id} dtes={dtes} />
}
