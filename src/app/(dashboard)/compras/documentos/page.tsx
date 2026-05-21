import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDocumentosCompra } from '@/services/compras.service'
import DocumentosCompraClient from '@/components/compras/DocumentosCompraClient'

export const metadata: Metadata = { title: 'Documentos de Compra' }

export default async function DocumentosCompraPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const documentos = await getDocumentosCompra({ empresa_id: empresa.id }).catch(() => [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Documentos de Compra</h1>
          <p className="text-sm text-slate-500 mt-0.5">{documentos.length} documentos registrados</p>
        </div>
        <Link href="/compras/documentos/nuevo"
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Documento
        </Link>
      </div>
      <DocumentosCompraClient documentos={documentos} empresa_id={empresa.id} />
    </div>
  )
}
