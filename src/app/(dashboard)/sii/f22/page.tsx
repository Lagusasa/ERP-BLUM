import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { calcularF22 } from '@/services/sii.service'
import F22Client from '@/components/sii/F22Client'

export const metadata: Metadata = { title: 'F22 — Declaración de Renta' }

export default async function F22Page({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const anio = Number(params.anio ?? new Date().getFullYear())
  const lineas = await calcularF22(empresa.id, anio)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Formulario 22 — Impuesto a la Renta</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cálculo estimado. Revisa con tu contador antes de presentar.</p>
      </div>
      <F22Client empresa_id={empresa.id} anio={anio} lineas={lineas} />
    </div>
  )
}
