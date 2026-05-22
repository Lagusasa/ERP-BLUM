import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getTrabajadores } from '@/services/remuneraciones.service'
import TrabajadoresClient from '@/components/remuneraciones/TrabajadoresClient'

export const metadata: Metadata = { title: 'Trabajadores' }

export default async function TrabajadoresPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null
  const trabajadores = await getTrabajadores(empresa.id)
  return <TrabajadoresClient trabajadores={trabajadores} empresa_id={empresa.id} />
}
