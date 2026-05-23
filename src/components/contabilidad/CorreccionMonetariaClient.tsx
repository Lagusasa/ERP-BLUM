'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanCuenta, PeriodoContable } from '@/types/contabilidad.types'

interface ItemCorreccion {
  cuenta_id: string
  cuenta_codigo: string
  cuenta_nombre: string
  saldo: number
  uf_inicio: number
  uf_fin: number
  monto_correccion: number
}

interface Props {
  empresa_id: string
  cuentas: PlanCuenta[]
  periodos: PeriodoContable[]
}

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

export default function CorreccionMonetariaClient({ empresa_id, cuentas, periodos }: Props) {
  const router = useRouter()
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual)
  const [ufInicio, setUfInicio] = useState('')
  const [ufFin, setUfFin] = useState('')
  const [items, setItems] = useState<ItemCorreccion[]>([])
  const [loading, setLoading] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Cuentas sujetas a corrección monetaria (activos/pasivos no monetarios)
  const cuentasNoMonetarias = cuentas.filter((c) =>
    ['activo', 'patrimonio'].includes(c.clase) && c.es_imputable
  )

  async function calcular() {
    setError('')
    setMensaje('')
    if (!ufInicio || !ufFin) { setError('Ingresa UF inicio y fin de año.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/contabilidad/correccion-monetaria/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id, anio, uf_inicio: Number(ufInicio), uf_fin: Number(ufFin) }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'Error al calcular')
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function generarComprobante() {
    setError('')
    setGenerando(true)
    try {
      const res = await fetch('/api/contabilidad/correccion-monetaria/comprobante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id, anio, items }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? 'Error al generar comprobante')
      setMensaje(`Comprobante N° ${data.numero} generado correctamente.`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setGenerando(false)
    }
  }

  const totalCorreccion = items.reduce((s, i) => s + i.monto_correccion, 0)
  const variacionPct = ufInicio && ufFin
    ? (((Number(ufFin) - Number(ufInicio)) / Number(ufInicio)) * 100).toFixed(2)
    : null

  return (
    <div className="space-y-5">
      {/* Parámetros */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Parámetros del ejercicio</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Año tributario</label>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {[anioActual, anioActual - 1, anioActual - 2].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">UF 01/01/{anio}</label>
            <input
              type="number"
              step="0.01"
              value={ufInicio}
              onChange={(e) => setUfInicio(e.target.value)}
              placeholder="Ej: 35.000,00"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">UF 31/12/{anio}</label>
            <input
              type="number"
              step="0.01"
              value={ufFin}
              onChange={(e) => setUfFin(e.target.value)}
              placeholder="Ej: 37.000,00"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={calcular}
              disabled={loading}
              className="w-full px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Calculando…' : 'Calcular'}
            </button>
          </div>
        </div>

        {variacionPct && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
            Variación UF año {anio}: <strong>{variacionPct}%</strong>
            {' '}— Factor de corrección: <strong>{(Number(ufFin) / Number(ufInicio)).toFixed(6)}</strong>
          </div>
        )}
      </div>

      {/* Referencia normativa */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Art. 41 LIR:</strong> Están sujetos a corrección monetaria los activos no monetarios
        (existencias, activos fijos, acciones, derechos) y el capital propio. Los activos monetarios
        (caja, cuentas por cobrar, préstamos a tasa fija) no se corrigen.
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
      {mensaje && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">{mensaje}</p>}

      {/* Tabla de resultados */}
      {items.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Detalle corrección monetaria</h2>
            <button
              onClick={generarComprobante}
              disabled={generando}
              className="px-4 py-2 text-sm bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg disabled:opacity-50"
            >
              {generando ? 'Generando…' : 'Generar comprobante'}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Cuenta</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Saldo inicial</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Factor UF</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Corrección</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.cuenta_id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-slate-700">{item.cuenta_codigo}</p>
                    <p className="text-xs text-slate-500">{item.cuenta_nombre}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700 text-xs">{CLP(item.saldo)}</td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs">
                    {(item.uf_fin / item.uf_inicio).toFixed(6)}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium text-xs ${item.monto_correccion >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {CLP(item.monto_correccion)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-slate-700">Total corrección monetaria</td>
                <td className={`px-4 py-3 text-right tabular-nums font-bold ${totalCorreccion >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {CLP(totalCorreccion)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Guía de cuentas */}
      {items.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Cuentas no monetarias disponibles ({cuentasNoMonetarias.length})</h2>
          <p className="text-xs text-slate-500 mb-3">
            El cálculo tomará los saldos al 01/01/{anio} de estas cuentas y aplicará el factor de variación UF.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {cuentasNoMonetarias.slice(0, 12).map((c) => (
              <div key={c.id} className="text-xs text-slate-600 border border-slate-100 rounded px-2 py-1">
                <span className="font-mono text-slate-400">{c.codigo}</span> {c.nombre}
              </div>
            ))}
            {cuentasNoMonetarias.length > 12 && (
              <div className="text-xs text-slate-400 px-2 py-1">+{cuentasNoMonetarias.length - 12} más…</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
