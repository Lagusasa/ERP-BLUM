import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getEmpresaActiva } from '@/lib/empresa'
import { getLibroIVAVentas } from '@/services/tributacion.service'
import LibroIVAClient from '@/components/tributacion/LibroIVAClient'
import PeriodoSelector from '@/components/tributacion/PeriodoSelector'

export const metadata: Metadata = { title: 'Libro IVA Ventas' }

interface PageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>
}

export default async function LibroVentasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const now = new Date()
  const mes = parseInt(params.mes ?? '') || (now.getMonth() + 1)
  const anio = parseInt(params.anio ?? '') || now.getFullYear()

  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const documentos = await getLibroIVAVentas(empresa.id, mes, anio)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Libro IVA Ventas</h2>
        <Suspense>
          <PeriodoSelector mes={mes} anio={anio} basePath="/tributacion/libro-ventas" />
        </Suspense>
      </div>
      <LibroIVAClient documentos={documentos} tipo="ventas" mes={mes} anio={anio} />
    </div>
  )
}
