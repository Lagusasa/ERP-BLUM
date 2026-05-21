import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getBoletasHonorarios } from '@/services/sii.service'
import HonorariosClient from '@/components/sii/HonorariosClient'

export const metadata: Metadata = { title: 'Boletas de Honorarios' }

export default async function HonorariosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null
  const boletas = await getBoletasHonorarios(empresa.id)
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Boletas de Honorarios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Registro con retención 10% automática.</p>
      </div>
      <HonorariosClient empresa_id={empresa.id} boletas={boletas} />
    </div>
  )
}
