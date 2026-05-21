import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getEmpresaActiva } from '@/lib/empresa'
import { getLiquidaciones } from '@/services/remuneraciones.service'
import LiquidacionesClient from '@/components/remuneraciones/LiquidacionesClient'
import PeriodoSelector from '@/components/tributacion/PeriodoSelector'

export const metadata: Metadata = { title: 'Liquidaciones' }

interface PageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>
}

export default async function LiquidacionesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const now = new Date()
  const mes = parseInt(params.mes ?? '') || (now.getMonth() + 1)
  const anio = parseInt(params.anio ?? '') || now.getFullYear()

  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const liquidaciones = await getLiquidaciones(empresa.id, mes, anio)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Liquidaciones del período</h2>
        <Suspense>
          <PeriodoSelector mes={mes} anio={anio} basePath="/remuneraciones/liquidaciones" />
        </Suspense>
      </div>
      <LiquidacionesClient liquidaciones={liquidaciones} mes={mes} anio={anio} />
    </div>
  )
}
