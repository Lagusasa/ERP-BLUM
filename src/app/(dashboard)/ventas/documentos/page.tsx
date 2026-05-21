import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDocumentosVenta } from '@/services/ventas.service'
import DocumentosVentaClient from '@/components/ventas/DocumentosVentaClient'

export const metadata: Metadata = { title: 'Documentos de Venta' }

export default async function DocumentosVentaPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const documentos = await getDocumentosVenta({ empresa_id: empresa.id }).catch(() => [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Documentos de Venta</h1>
          <p className="text-sm text-slate-500 mt-0.5">{documentos.length} documentos registrados</p>
        </div>
        <Link href="/ventas/documentos/nuevo"
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Documento
        </Link>
      </div>
      <DocumentosVentaClient documentos={documentos} empresa_id={empresa.id} />
    </div>
  )
}
