import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getProveedores, getTiposDocumento } from '@/services/compras.service'
import DocumentoCompraForm from '@/components/compras/DocumentoCompraForm'

export const metadata: Metadata = { title: 'Registrar Documento de Compra' }

export default async function NuevoDocumentoCompraPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [proveedores, tiposDoc] = await Promise.allSettled([
    getProveedores(empresa.id),
    getTiposDocumento(),
  ])

  const listaProveedores = proveedores.status === 'fulfilled' ? proveedores.value.filter((p) => p.is_active) : []
  const listaTipos = tiposDoc.status === 'fulfilled' ? tiposDoc.value : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registrar Documento de Compra</h1>
        <p className="text-sm text-slate-500 mt-0.5">Factura, nota de crédito, nota de débito u otro</p>
      </div>
      <DocumentoCompraForm
        empresa_id={empresa.id}
        proveedores={listaProveedores}
        tiposDocumento={listaTipos}
      />
    </div>
  )
}
