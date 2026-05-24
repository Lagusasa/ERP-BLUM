import type { Metadata } from 'next'
import Link from 'next/link'
import { getEmpresaActiva } from '@/lib/empresa'
import { getResumenCaja, getMovimientosCaja } from '@/services/finanzas.service'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TIPO_CUENTA_LABELS, CATEGORIA_LABELS } from '@/types/finanzas.types'

export const metadata: Metadata = { title: 'Finanzas — Flujo de Caja' }

export default async function FinanzasPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const resumen = await getResumenCaja(empresa.id)
  const movimientos = await getMovimientosCaja(empresa.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Flujo de Caja</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tesorería, cuentas bancarias y movimientos.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finanzas/cuentas/nueva"
            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            + Cuenta
          </Link>
          <Link href="/finanzas/movimientos/nuevo"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Movimiento
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:col-span-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Saldo Total</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${resumen.saldo_total >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
            {formatCurrency(resumen.saldo_total)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{resumen.cuentas.length} cuenta{resumen.cuentas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Ingresos mes</p>
          <p className="text-2xl font-bold text-green-600 mt-1 tabular-nums">{formatCurrency(resumen.ingresos_mes)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Egresos mes</p>
          <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{formatCurrency(resumen.egresos_mes)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${resumen.flujo_neto >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Flujo neto mes</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${resumen.flujo_neto >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatCurrency(resumen.flujo_neto)}
          </p>
        </div>
      </div>

      {/* Cuentas bancarias */}
      {resumen.cuentas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumen.cuentas.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.banco}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{TIPO_CUENTA_LABELS[c.tipo_cuenta]} · {c.numero_cuenta}</p>
                </div>
                <span className="text-xs text-slate-400">{c.moneda}</span>
              </div>
              <p className={`text-xl font-bold mt-3 tabular-nums ${c.saldo_actual >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                {formatCurrency(c.saldo_actual)}
              </p>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-green-600">↑ {formatCurrency(c.ingresos)}</span>
                <span className="text-red-600">↓ {formatCurrency(c.egresos)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {resumen.cuentas.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-500">No hay cuentas bancarias configuradas.</p>
          <Link href="/finanzas/cuentas/nueva"
            className="mt-2 inline-block text-sm text-emerald-700 hover:underline">
            Agregar primera cuenta →
          </Link>
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/finanzas/conciliacion"
          className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all">
          <p className="text-sm font-semibold text-slate-800">Conciliación Bancaria</p>
          <p className="text-xs text-slate-400 mt-1">Reconciliar movimientos con cartola bancaria.</p>
        </Link>
        <Link href="/finanzas/convenios"
          className="bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-300 hover:shadow-sm transition-all">
          <p className="text-sm font-semibold text-slate-800">Convenios de Pago</p>
          <p className="text-xs text-slate-400 mt-1">Control de deudas reestructuradas y cuotas pendientes.</p>
        </Link>
        <Link href="/finanzas/proyecciones"
          className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
          <p className="text-sm font-semibold text-slate-800">Flujo Proyectado</p>
          <p className="text-xs text-slate-400 mt-1">Proyecciones de ingresos y egresos por mes.</p>
        </Link>
        <Link href="/finanzas/movimientos"
          className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all">
          <p className="text-sm font-semibold text-slate-800">Todos los movimientos</p>
          <p className="text-xs text-slate-400 mt-1">Historial completo con filtros y exportación Excel.</p>
        </Link>
      </div>

      {/* Últimos movimientos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Últimos movimientos</h2>
          <Link href="/finanzas/movimientos" className="text-xs text-emerald-700 hover:underline">Ver todos →</Link>
        </div>
        {movimientos.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">Sin movimientos registrados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Descripción</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Cuenta</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Categoría</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.slice(0, 15).map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-slate-800">{m.descripcion}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{m.cuenta?.banco ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{CATEGORIA_LABELS[m.categoria] ?? m.categoria}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(m.fecha)}</td>
                  <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(m.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
