'use client'

import { useRef } from 'react'
import type { BalanceGeneral } from '@/types/reportes.types'

interface Empresa { id: string; razon_social: string; rut?: string }

interface Props {
  empresa: Empresa
  balance: BalanceGeneral
  anio: number
}

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

export default function LibroInventariosClient({ empresa, balance, anio }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  function imprimir() {
    window.print()
  }

  const fechaCierre = `${anio}-12-31`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">Ejercicio {anio} — Cierre al 31/12/{anio}</p>
        <button
          onClick={imprimir}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          Imprimir / PDF
        </button>
      </div>

      <div ref={printRef} className="bg-white border border-slate-200 rounded-xl p-8 space-y-8">
        {/* Encabezado oficial */}
        <div className="text-center border-b border-slate-200 pb-6">
          <h2 className="text-lg font-bold text-slate-900 uppercase">LIBRO DE INVENTARIOS Y BALANCES</h2>
          <p className="text-sm text-slate-600 mt-1">Artículo 17 N°1 del Código Tributario — Resolución SII</p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-left text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Empresa</span>
              <span className="font-semibold text-slate-800">{empresa.razon_social}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">RUT</span>
              <span className="font-semibold text-slate-800">{empresa.rut ?? '—'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Fecha de cierre</span>
              <span className="font-semibold text-slate-800">31 de diciembre de {anio}</span>
            </div>
          </div>
        </div>

        {/* INVENTARIO */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded text-xs flex items-center justify-center font-bold">I</span>
            INVENTARIO DE BIENES Y DERECHOS
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-600">Cuenta</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-slate-600">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {balance.activos.map((item) => (
                <tr key={item.codigo} className="border-b border-slate-100">
                  <td className="px-4 py-2">
                    <span className="font-mono text-xs text-slate-400 mr-2">{item.codigo}</span>
                    <span className="text-slate-700">{item.nombre}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-800">{CLP(item.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="px-4 py-2.5 font-bold text-slate-800 text-sm">TOTAL ACTIVO (INVENTARIO)</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-blue-800 text-sm">{CLP(balance.total_activo)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* DEUDAS Y OBLIGACIONES */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-red-100 text-red-700 rounded text-xs flex items-center justify-center font-bold">II</span>
            DEUDAS Y OBLIGACIONES
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-600">Cuenta</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-slate-600">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {balance.pasivos.map((item) => (
                <tr key={item.codigo} className="border-b border-slate-100">
                  <td className="px-4 py-2">
                    <span className="font-mono text-xs text-slate-400 mr-2">{item.codigo}</span>
                    <span className="text-slate-700">{item.nombre}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-800">{CLP(item.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-red-50 border-t-2 border-red-200">
                <td className="px-4 py-2.5 font-bold text-slate-800 text-sm">TOTAL PASIVO</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-red-700 text-sm">{CLP(balance.total_pasivo)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* PATRIMONIO */}
        <section>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded text-xs flex items-center justify-center font-bold">III</span>
            CAPITAL Y RESERVAS (PATRIMONIO)
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="text-left px-4 py-2 text-xs font-medium text-slate-600">Cuenta</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-slate-600">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {balance.patrimonio.map((item) => (
                <tr key={item.codigo} className="border-b border-slate-100">
                  <td className="px-4 py-2">
                    <span className="font-mono text-xs text-slate-400 mr-2">{item.codigo}</span>
                    <span className="text-slate-700">{item.nombre}</span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-800">{CLP(item.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                <td className="px-4 py-2.5 font-bold text-slate-800 text-sm">TOTAL PATRIMONIO</td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-emerald-700 text-sm">{CLP(balance.total_patrimonio)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Resumen ecuación patrimonial */}
        <section className="border-2 border-slate-300 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Resumen — Ecuación Patrimonial</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Total Activo</p>
              <p className="text-xl font-bold text-blue-800 tabular-nums mt-1">{CLP(balance.total_activo)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-xs text-red-600 uppercase tracking-wide font-medium">Total Pasivo</p>
              <p className="text-xl font-bold text-red-700 tabular-nums mt-1">{CLP(balance.total_pasivo)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Patrimonio</p>
              <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">{CLP(balance.total_patrimonio)}</p>
            </div>
          </div>
          <div className={`mt-3 text-center text-sm font-semibold ${Math.abs(balance.diferencia) < 1 ? 'text-emerald-700' : 'text-red-600'}`}>
            {Math.abs(balance.diferencia) < 1
              ? '✓ Balance cuadrado: Activo = Pasivo + Patrimonio'
              : `⚠ Diferencia de ${CLP(balance.diferencia)} — Verificar comprobantes`}
          </div>
        </section>

        {/* Pie */}
        <div className="border-t border-slate-200 pt-4 text-xs text-slate-400 text-center">
          Generado por ERP SaaS Chile — Ejercicio {anio} — Fecha cierre: 31/12/{anio}
        </div>
      </div>
    </div>
  )
}
