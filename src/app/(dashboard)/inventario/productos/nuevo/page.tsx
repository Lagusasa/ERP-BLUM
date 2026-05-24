import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCategorias, getUnidades, getProducto } from '@/services/inventario.service'
import NuevoProductoClient from '@/components/inventario/NuevoProductoClient'

export const metadata: Metadata = { title: 'Producto — Inventario' }

interface PageProps {
  searchParams: Promise<{ edit?: string }>
}

export default async function NuevoProductoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [categorias, unidades] = await Promise.all([
    getCategorias(empresa.id),
    getUnidades(empresa.id),
  ])

  const producto = params.edit ? await getProducto(params.edit, empresa.id) : null

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">
        {producto ? `Editar: ${producto.nombre}` : 'Nuevo Producto'}
      </h1>
      <NuevoProductoClient
        empresa_id={empresa.id}
        categorias={categorias}
        unidades={unidades}
        producto={producto ?? undefined}
      />
    </div>
  )
}
