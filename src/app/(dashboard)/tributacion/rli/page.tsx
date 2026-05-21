import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getRli } from '@/services/rli.service'
import RliClient from '@/components/tributacion/RliClient'

export const metadata: Metadata = { title: 'RLI — Renta Líquida Imponible' }

interface Props {
  searchParams: Promise<{ anio?: string; tasa?: string }>
}

export default async function RliPage({ searchParams }: Props) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const params = await searchParams
  const anio = params.anio ? Number(params.anio) : new Date().getFullYear()
  const tasa = params.tasa ? Number(params.tasa) : 0.27

  const resumen = await getRli(empresa.id, anio, tasa)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Renta Líquida Imponible</h1>
          <p className="text-sm text-slate-500 mt-0.5">Base para el Impuesto de Primera Categoría.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2">
          <span className="text-sm text-slate-500">Ejercicio:</span>
          <form method="GET">
            <select name="anio" defaultValue={anio}
              onChange={(e) => { if (typeof window !== 'undefined') (e.target.form as HTMLFormElement).submit() }}
              className="text-sm border-0 focus:outline-none font-medium text-slate-800 bg-transparent">
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </form>
        </div>
      </div>
      <RliClient empresa_id={empresa.id} anio={anio} resumen={resumen} />
    </div>
  )
}
