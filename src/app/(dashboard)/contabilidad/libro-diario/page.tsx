import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getComprobantes } from '@/services/contabilidad.service'
import LibroDiarioClient from '@/components/contabilidad/LibroDiarioClient'

export const metadata: Metadata = { title: 'Libro Diario' }

interface Props {
  searchParams: Promise<{ anio?: string }>
}

export default async function LibroDiarioPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const anio = params.anio ? parseInt(params.anio, 10) : new Date().getFullYear()

  const comprobantes = await getComprobantes({
    empresa_id: empresa.id,
    anio,
  }).catch(() => [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Libro Diario</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {comprobantes.length} comprobantes — {anio}
          </p>
        </div>
        <Link
          href="/contabilidad/libro-diario/nuevo"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Comprobante
        </Link>
      </div>

      <LibroDiarioClient comprobantes={comprobantes} empresa_id={empresa.id} anio={anio} />
    </div>
  )
}
