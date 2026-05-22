import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getIndicadores, getAFPs } from '@/services/remuneraciones.service'
import IndicadoresClient from '@/components/remuneraciones/IndicadoresClient'

export const metadata: Metadata = { title: 'Indicadores Previsionales' }

export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>
}) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const now  = new Date()
  const params = await searchParams
  const anio = parseInt(params.anio ?? String(now.getFullYear()))

  const [indicadores, afps] = await Promise.all([
    getIndicadores(empresa.id, anio),
    getAFPs(),
  ])

  return (
    <IndicadoresClient
      indicadores={indicadores}
      afps={afps}
      empresa_id={empresa.id}
      anio={anio}
    />
  )
}
