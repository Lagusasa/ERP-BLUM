'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'

interface ResumenIVA {
  mes: number
  anio: number
  debito_fiscal: number
  credito_fiscal: number
  iva_a_pagar: number
  remanente: number
}

interface DeclaracionF29 {
  id: string
  periodo_mes: number
  periodo_anio: number
  estado: string
  total_debito_fiscal: number
  total_credito_fiscal: number
  iva_a_pagar: number
  remanente_credito: number
  ppm_monto: number
  total_a_pagar: number
  fecha_presentacion: string | null
}

interface Props {
  resumen: ResumenIVA
  empresa_id: string
  declaraciones: DeclaracionF29[]
  mes: number
  anio: number
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ESTADO_STYLE: Record<string, string> = {
  borrador:       'bg-slate-100 text-slate-600',
  presentada:     'bg-emerald-100 text-emerald-700',
  rectificatoria: 'bg-amber-100 text-amber-700',
}

export default function F29Client({ resumen, empresa_id, declaraciones, mes, anio }: Props) {
  const router = useRouter()
  const [presentando, setPresentando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const declaracionActual = declaraciones.find(
    (d) => d.periodo_mes === mes && d.periodo_anio === anio
  )
  const yaDeclarado = declaracionActual?.estado === 'presentada' || declaracionActual?.estado === 'rectificatoria'

  async function presentar() {
    const accion = yaDeclarado ? 'Rectificatoria' : 'Presentar'
    if (!confirm(`¿${accion} F29 de ${MESES[mes - 1]} ${anio}?\n\nIVA a pagar: ${formatCurrency(resumen.iva_a_pagar)}\nRemanente: ${formatCurrency(resumen.remanente)}`)) return
    setPresentando(true)
    setError(null)
    try {
      const res = await fetch('/api/tributacion/f29', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id,
          mes,
          anio,
          debito_fiscal: resumen.debito_fiscal,
          credito_fiscal: resumen.credito_fiscal,
          iva_a_pagar: resumen.iva_a_pagar,
          remanente: resumen.remanente,
          es_rectificatoria: yaDeclarado,
        }),
      })
      const d = await res.json()
      if (!d.ok) throw new Error(d.error)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al presentar')
    } finally {
      setPresentando(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Botón presentar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4 print:hidden">
        <div>
          {declaracionActual ? (
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_STYLE[declaracionActual.estado] ?? ''}`}>
                {declaracionActual.estado.charAt(0).toUpperCase() + declaracionActual.estado.slice(1)}
              </span>
              {declaracionActual.fecha_presentacion && (
                <span className="text-xs text-slate-400">
                  Presentada {formatDate(declaracionActual.fecha_presentacion)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">F29 de {MESES[mes - 1]} {anio} no presentado aún.</p>
          )}
        </div>
        <button
          onClick={presentar}
          disabled={presentando}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50 transition-colors"
        >
          {presentando ? 'Guardando…' : yaDeclarado ? 'Presentar Rectificatoria' : 'Presentar F29'}
        </button>
      </div>

      {/* Historial */}
      {declaraciones.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">Historial de Declaraciones F29</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Período</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Débito</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Crédito</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">IVA Pagar</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Remanente</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {declaraciones.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-800">
                    {MESES[d.periodo_mes - 1]} {d.periodo_anio}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.total_debito_fiscal)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatCurrency(d.total_credito_fiscal)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums font-medium text-red-700">
                    {d.iva_a_pagar > 0 ? formatCurrency(d.iva_a_pagar) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums font-medium text-green-700">
                    {d.remanente_credito > 0 ? formatCurrency(d.remanente_credito) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_STYLE[d.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                      {d.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs text-slate-500">
                    {d.fecha_presentacion ? formatDate(d.fecha_presentacion) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
