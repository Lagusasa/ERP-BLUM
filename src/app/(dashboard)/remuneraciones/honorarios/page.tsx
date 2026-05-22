import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getPagosHonorarios, getIndicadores } from '@/services/remuneraciones.service'
import LibroHonorariosClient from '@/components/remuneraciones/LibroHonorariosClient'

export const metadata: Metadata = { title: 'Libro de Honorarios' }

export default async function LibroHonorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>
}) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const now  = new Date()
  const params = await searchParams
  const anio = parseInt(params.anio ?? String(now.getFullYear()))

  const [pagos, indicadores] = await Promise.all([
    getPagosHonorarios(empresa.id, anio),
    getIndicadores(empresa.id, anio),
  ])

  return (
    <LibroHonorariosClient
      pagos={pagos}
      empresa_id={empresa.id}
      empresa_razon_social={empresa.razon_social}
      empresa_rut={empresa.rut}
      anio={anio}
      retencion_default={indicadores.retencion_honorarios_pct}
    />
  )
}
