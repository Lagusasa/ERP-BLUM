import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getProyecciones, getMovimientosCaja } from '@/services/finanzas.service'
import ProyeccionesClient from '@/components/finanzas/ProyeccionesClient'

export const metadata: Metadata = { title: 'Flujo Proyectado — Finanzas' }

export default async function ProyeccionesPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 6, 0).toISOString().split('T')[0]

  const [proyecciones, movimientos] = await Promise.all([
    getProyecciones(empresa.id, desde, hasta),
    getMovimientosCaja(empresa.id, desde, hasta),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Flujo de Caja Proyectado</h1>
          <p className="text-sm text-slate-500 mt-0.5">Compara lo proyectado vs lo real para los próximos 6 meses.</p>
        </div>
        <Link href="/finanzas" className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          ← Volver
        </Link>
      </div>

      <ProyeccionesClient proyecciones={proyecciones} movimientos={movimientos} empresa_id={empresa.id} />
    </div>
  )
}
