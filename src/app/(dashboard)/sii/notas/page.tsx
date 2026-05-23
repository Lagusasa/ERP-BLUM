import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDteDocumentos } from '@/services/sii.service'
import NotasCreditoDebitoClient from '@/components/sii/NotasCreditoDebitoClient'

export const metadata: Metadata = { title: 'Notas de Crédito y Débito' }

export default async function NotasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [facturas, notas] = await Promise.all([
    getDteDocumentos(empresa.id, '33'),
    getDteDocumentos(empresa.id).then((all) => all.filter((d) => d.tipo_dte === '61' || d.tipo_dte === '56')),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notas de Crédito y Débito</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Nota de Crédito (tipo 61) para anular o rebajar facturas. Nota de Débito (tipo 56) para aumentar cobros.
        </p>
      </div>
      <NotasCreditoDebitoClient empresa_id={empresa.id} facturas={facturas} notas={notas} />
    </div>
  )
}
