import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import ConveniosPagoClient from '@/components/finanzas/ConveniosPagoClient'

export const metadata: Metadata = { title: 'Convenios de Pago' }

export default async function ConveniosPagoPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Convenios de Pago</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Control de deudas reestructuradas, convenios SII/TGR y acuerdos de pago con proveedores.
        </p>
      </div>
      <ConveniosPagoClient empresa_id={empresa.id} />
    </div>
  )
}
