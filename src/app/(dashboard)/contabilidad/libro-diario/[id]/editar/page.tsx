import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEmpresaActiva } from '@/lib/empresa'
import { getComprobante, getCuentasImputables } from '@/services/contabilidad.service'
import EditarComprobanteClient from '@/components/contabilidad/EditarComprobanteClient'

export const metadata: Metadata = { title: 'Editar Comprobante' }

export default async function EditarComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [comp, cuentas] = await Promise.all([
    getComprobante(id, empresa.id),
    getCuentasImputables(empresa.id),
  ])

  if (!comp) notFound()
  if (comp.estado === 'anulado') notFound()

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Editar Comprobante #{comp.numero}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {comp.estado === 'aprobado'
            ? 'Comprobante aprobado — solo se puede editar la glosa y referencia.'
            : 'Comprobante en borrador — todos los campos son editables.'}
        </p>
      </div>

      <EditarComprobanteClient
        comprobante={comp}
        empresa_id={empresa.id}
        cuentas={cuentas}
      />
    </div>
  )
}
