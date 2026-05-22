import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getProductos } from '@/services/inventario.service'
import ProductosClient from '@/components/inventario/ProductosClient'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const productos = await getProductos(empresa.id)

  return <ProductosClient productos={productos} empresa_id={empresa.id} />
}
