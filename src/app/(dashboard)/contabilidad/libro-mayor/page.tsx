import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getCuentasImputables, getLibroMayor } from '@/services/contabilidad.service'
import { formatCurrency, formatDate } from '@/lib/utils'

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Libro Mayor</h1>
        <p className="text-sm text-slate-500 mt-0.5">Movimientos por cuenta con saldo acumulado.</p>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 items-end">
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

      {mayor.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">
          No hay movimientos aprobados en el período seleccionado.
        </div>
      ) : (
        <div className="space-y-4">
          {mayor.map((cuenta) => (
            <div key={cuenta.cuenta_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Header cuenta */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">{cuenta.codigo}</span>
                  <span className="ml-2 text-sm font-semibold text-slate-800">{cuenta.nombre}</span>
                  <span className="ml-2 text-xs text-slate-400 capitalize">{cuenta.clase}</span>
                </div>
                <div className="flex gap-6 text-xs text-slate-500">
                  <span>Saldo anterior: <strong className="text-slate-700">{formatCurrency(cuenta.saldo_anterior)}</strong></span>
                  <span className="text-green-600">Debe: <strong>{formatCurrency(cuenta.total_debe)}</strong></span>
                  <span className="text-red-600">Haber: <strong>{formatCurrency(cuenta.total_haber)}</strong></span>
                  <span className={`font-bold ${cuenta.saldo_final >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    Saldo: {formatCurrency(cuenta.saldo_final)}
                  </span>
                </div>
              </div>

              {/* Movimientos */}
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-2 text-xs font-medium text-slate-500">Fecha</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">N° Comp.</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Glosa</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Debe</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Haber</th>
                    <th className="text-right px-5 py-2 text-xs font-medium text-slate-500">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* Saldo anterior */}
                  {cuenta.saldo_anterior !== 0 && (
                    <tr className="bg-slate-50/50">
                      <td className="px-5 py-1.5 text-xs text-slate-400" colSpan={3}>Saldo anterior al período</td>
                      <td className="px-4 py-1.5 text-right text-xs text-slate-400">—</td>
                      <td className="px-4 py-1.5 text-right text-xs text-slate-400">—</td>
                      <td className="px-5 py-1.5 text-right text-xs font-medium text-slate-500 tabular-nums">
                        {formatCurrency(cuenta.saldo_anterior)}
                      </td>
                    </tr>
                  )}
                  {cuenta.movimientos.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-2 text-xs text-slate-500">{formatDate(m.fecha)}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">#{m.numero}</td>
                      <td className="px-4 py-2 text-slate-700 truncate max-w-xs">{m.glosa || '—'}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-green-700">
                        {m.debe > 0 ? formatCurrency(m.debe) : '—'}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-red-600">
                        {m.haber > 0 ? formatCurrency(m.haber) : '—'}
                      </td>
                      <td className={`px-5 py-2 text-right tabular-nums font-medium ${m.saldo >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                        {formatCurrency(m.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totales */}
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-5 py-2 text-xs font-semibold text-slate-600">
                      Total período ({cuenta.movimientos.length} movimientos)
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold text-green-700">
                      {formatCurrency(cuenta.total_debe)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-bold text-red-600">
                      {formatCurrency(cuenta.total_haber)}
                    </td>
                    <td className={`px-5 py-2 text-right tabular-nums font-bold ${cuenta.saldo_final >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                      {formatCurrency(cuenta.saldo_final)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
