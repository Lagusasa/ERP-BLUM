import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getLibroRemuneraciones } from '@/services/remuneraciones.service'
import LibroRemuneracionesClient from '@/components/remuneraciones/LibroRemuneracionesClient'

export const metadata: Metadata = { title: 'Libro de Remuneraciones' }

export default async function LibroRemuneracionesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>
}) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const now = new Date()
  const params = await searchParams
  const mes  = parseInt(params.mes  ?? String(now.getMonth() + 1))
  const anio = parseInt(params.anio ?? String(now.getFullYear()))

  const liquidaciones = await getLibroRemuneraciones(empresa.id, mes, anio)

  return (
    <LibroRemuneracionesClient
      liquidaciones={liquidaciones}
      empresa_razon_social={empresa.razon_social}
      empresa_rut={empresa.rut}
      mes={mes}
      anio={anio}
    />
  )
}
