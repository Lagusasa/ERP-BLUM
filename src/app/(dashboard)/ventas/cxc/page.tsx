import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDocumentosVenta } from '@/services/ventas.service'
import CxCClient from '@/components/ventas/CxCClient'

export const metadata: Metadata = { title: 'CxC — Cuentas por Cobrar' }

export default async function CxCPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const documentos = await getDocumentosVenta({ empresa_id: empresa.id }).catch(() => [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cuentas por Cobrar</h1>
        <p className="text-sm text-slate-500 mt-0.5">Documentos pendientes de cobro agrupados por antigüedad.</p>
      </div>
      <CxCClient documentos={documentos} empresa_id={empresa.id} />
    </div>
  )
}
