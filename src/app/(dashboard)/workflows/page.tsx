import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getInstancias, getWorkflowConfigs } from '@/services/workflows.service'
import WorkflowsClient from '@/components/workflows/WorkflowsClient'

export const metadata: Metadata = { title: 'Workflows' }

interface Props {
  searchParams: Promise<{ estado?: string }>
}

export default async function WorkflowsPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const [instancias, configs] = await Promise.all([
    getInstancias(empresa.id, params.estado),
    getWorkflowConfigs(empresa.id),
  ])

  return (
    <WorkflowsClient
      instancias={instancias}
      configs={configs}
      empresa_id={empresa.id}
      filtroEstado={params.estado}
    />
  )
}
