import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getClientes } from '@/services/ventas.service'
import ClientesClient from '@/components/ventas/ClientesClient'

export const metadata: Metadata = { title: 'Clientes' }

export default async function ClientesPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const clientes = await getClientes(empresa.id).catch(() => [])

  return <ClientesClient clientes={clientes} empresa_id={empresa.id} />
}
