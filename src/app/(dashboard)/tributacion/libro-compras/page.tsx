import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getEmpresaActiva } from '@/lib/empresa'
import { getLibroIVACompras } from '@/services/tributacion.service'
import LibroIVAClient from '@/components/tributacion/LibroIVAClient'
import PeriodoSelector from '@/components/tributacion/PeriodoSelector'

export const metadata: Metadata = { title: 'Libro IVA Compras' }

interface PageProps {
  searchParams: Promise<{ mes?: string; anio?: string }>
}

export default async function LibroComprasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const now = new Date()
  const mes = parseInt(params.mes ?? '') || (now.getMonth() + 1)
  const anio = parseInt(params.anio ?? '') || now.getFullYear()

  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const documentos = await getLibroIVACompras(empresa.id, mes, anio)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Libro IVA Compras</h2>
        <Suspense>
          <PeriodoSelector mes={mes} anio={anio} basePath="/tributacion/libro-compras" />
        </Suspense>
      </div>
      <LibroIVAClient documentos={documentos} tipo="compras" mes={mes} anio={anio} />
    </div>
  )
}
