import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDocumentosCompra } from '@/services/compras.service'
import CxPClient from '@/components/compras/CxPClient'

export const metadata: Metadata = { title: 'CxP — Cuentas por Pagar' }

export default async function CxPPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const documentos = await getDocumentosCompra({ empresa_id: empresa.id }).catch(() => [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cuentas por Pagar</h1>
        <p className="text-sm text-slate-500 mt-0.5">Documentos pendientes de pago agrupados por antigüedad.</p>
      </div>
      <CxPClient documentos={documentos} empresa_id={empresa.id} />
    </div>
  )
}
