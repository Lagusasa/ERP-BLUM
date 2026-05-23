import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getBoletasHonorarios } from '@/services/sii.service'
import DeclaracionesJuradasClient from '@/components/tributacion/DeclaracionesJuradasClient'

export const metadata: Metadata = { title: 'Declaraciones Juradas' }

export default async function DeclaracionesJuradasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const boletas = await getBoletasHonorarios(empresa.id)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Declaraciones Juradas Anuales</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          DJ 1879 honorarios, DJ 1887 remuneraciones y DJ 1886 retenciones — presentación ante SII.
        </p>
      </div>
      <DeclaracionesJuradasClient empresa_id={empresa.id} boletas={boletas} />
    </div>
  )
}
