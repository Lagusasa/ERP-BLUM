import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getTrabajadores } from '@/services/remuneraciones.service'
import NuevaLiquidacionForm from '@/components/remuneraciones/NuevaLiquidacionForm'

export const metadata: Metadata = { title: 'Nueva Liquidación' }

interface PageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>
}

export default async function NuevaLiquidacionPage({ searchParams }: PageProps) {
  const params = await searchParams
  const now = new Date()
  const mes = parseInt(params.mes ?? '') || (now.getMonth() + 1)
  const anio = parseInt(params.anio ?? '') || now.getFullYear()

  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const trabajadores = await getTrabajadores(empresa.id)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Nueva liquidación</h2>
        <p className="text-sm text-slate-500 mt-0.5">Calcula automáticamente según normativa chilena</p>
      </div>
      <NuevaLiquidacionForm
        empresa_id={empresa.id}
        trabajadores={trabajadores}
        mes={mes}
        anio={anio}
      />
    </div>
  )
}
