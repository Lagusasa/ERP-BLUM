import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import type { LibroMayorCuenta } from '@/services/contabilidad.service'
import { getCuentasImputables, getLibroMayor } from '@/services/contabilidad.service'
import LibroMayorClient from '@/components/contabilidad/LibroMayorClient'

export const metadata: Metadata = { title: 'Libro Mayor' }

export default async function LibroMayorPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; cuenta_id?: string }>
}) {
  const empresa = await getEmpresaActiva()
  if (!empresa) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800">
      Selecciona una empresa para ver el Libro Mayor.
    </div>
  )

  const now = new Date()
  const params = await searchParams
  const desde    = params.desde    ?? `${now.getFullYear()}-01-01`
  const hasta    = params.hasta    ?? now.toISOString().split('T')[0]
  const cuentaId = params.cuenta_id ?? ''

  const [cuentas, mayor] = await Promise.all([
    getCuentasImputables(empresa.id),
    getLibroMayor(empresa.id, desde, hasta, cuentaId || undefined),
  ])

  const cuentaSeleccionada = cuentaId
    ? cuentas.find((c) => c.id === cuentaId)
    : undefined

  return (
    <div className="space-y-4">
      {/* Encabezado + botones */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Libro Mayor</h1>
          <p className="text-sm text-slate-500 mt-0.5">Movimientos por cuenta con saldo acumulado.</p>
        </div>
      </div>

      {/* Filtros — ocultos en impresión */}
      <form method="GET" className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 items-end print:hidden">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
          <input type="date" name="desde" defaultValue={desde}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
          <input type="date" name="hasta" defaultValue={hasta}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="min-w-[240px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Cuenta (opcional)</label>
          <select name="cuenta_id" defaultValue={cuentaId}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">— Todas las cuentas —</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit"
          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          Aplicar
        </button>
      </form>

      {/* Contenido interactivo: botones export/print + tablas */}
      <LibroMayorClient
        mayor={mayor as LibroMayorCuenta[]}
        empresa_razon_social={empresa.razon_social}
        empresa_rut={empresa.rut}
        desde={desde}
        hasta={hasta}
        cuenta_nombre={cuentaSeleccionada
          ? `${cuentaSeleccionada.codigo} — ${cuentaSeleccionada.nombre}`
          : undefined}
      />
    </div>
  )
}
