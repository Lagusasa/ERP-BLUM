import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getProveedores } from '@/services/compras.service'
import ProveedoresClient from '@/components/compras/ProveedoresClient'

export const metadata: Metadata = { title: 'Proveedores' }

export default async function ProveedoresPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const proveedores = await getProveedores(empresa.id).catch(() => [])

  return <ProveedoresClient proveedores={proveedores} empresa_id={empresa.id} />
}
