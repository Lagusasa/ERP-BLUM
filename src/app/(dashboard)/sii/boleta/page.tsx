import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getDteByTipo } from '@/services/sii.service'
import BoletaElectronicaClient from '@/components/sii/BoletaElectronicaClient'

export const metadata: Metadata = { title: 'Boleta Electrónica' }

export default async function BoletaPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const boletas = await getDteByTipo(empresa.id, '39')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Boleta Electrónica</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Emisión de boletas electrónicas (tipo 39) con IVA incluido para consumidores finales.
        </p>
      </div>
      <BoletaElectronicaClient empresa_id={empresa.id} boletas={boletas} />
    </div>
  )
}
