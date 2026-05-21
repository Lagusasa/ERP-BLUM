import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getClientes } from '@/services/ventas.service'
import { getTiposDocumento } from '@/services/compras.service'
import DocumentoVentaForm from '@/components/ventas/DocumentoVentaForm'

export const metadata: Metadata = { title: 'Registrar Documento de Venta' }

export default async function NuevoDocumentoVentaPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [clientes, tiposDoc] = await Promise.allSettled([
    getClientes(empresa.id),
    getTiposDocumento(undefined, true),
  ])

  const listaClientes = clientes.status === 'fulfilled' ? clientes.value.filter((c) => c.is_active) : []
  const listaTipos = tiposDoc.status === 'fulfilled' ? tiposDoc.value : []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Registrar Documento de Venta</h1>
        <p className="text-sm text-slate-500 mt-0.5">Factura, boleta, nota de crédito u otro</p>
      </div>
      <DocumentoVentaForm
        empresa_id={empresa.id}
        clientes={listaClientes}
        tiposDocumento={listaTipos}
      />
    </div>
  )
}
