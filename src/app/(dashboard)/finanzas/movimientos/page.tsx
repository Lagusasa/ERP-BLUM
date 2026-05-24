import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentasBancarias, getMovimientosCaja } from '@/services/finanzas.service'
import MovimientosClient from '@/components/finanzas/MovimientosClient'

export const metadata: Metadata = { title: 'Movimientos — Finanzas' }

export default async function MovimientosPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [movimientos, cuentas] = await Promise.all([
    getMovimientosCaja(empresa.id),
    getCuentasBancarias(empresa.id),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Movimientos de Caja</h1>
          <p className="text-sm text-slate-500 mt-0.5">Historial completo de ingresos y egresos.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finanzas" className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            ← Volver
          </Link>
          <Link href="/finanzas/movimientos/nuevo"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo
          </Link>
        </div>
      </div>

      <MovimientosClient movimientos={movimientos} cuentas={cuentas} />
    </div>
  )
}
