'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Trabajador, TerminacionContrato, CausalTerminacion } from '@/types/remuneraciones.types'
import { CAUSAL_LABELS } from '@/types/remuneraciones.types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  empresa_id: string
  trabajadores: Trabajador[]
}

const CAUSALES_159: CausalTerminacion[] = ['159_1','159_2','159_3','159_4','159_5','159_6']
const CAUSALES_160: CausalTerminacion[] = ['160_1','160_2','160_3','160_4','160_5','160_6','160_7','160_8']

export default function TerminacionesClient({ empresa_id, trabajadores }: Props) {
  const [terminaciones, setTerminaciones] = useState<TerminacionContrato[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [finiquitoId, setFiniquitoId] = useState<string | null>(null)

  // Form state
  const [fTrabajador, setFTrabajador] = useState('')
  const [fFechaTermino, setFFechaTermino] = useState('')
  const [fCausal, setFCausal] = useState<CausalTerminacion>('159_2')
  const [fDescripcion, setFDescripcion] = useState('')
  const [fPreaviso, setFPreaviso] = useState('30')
  const [fIndemnAnios, setFIndemnAnios] = useState('0')
  const [fIndemnMonto, setFIndemnMonto] = useState('0')
  const [fVacPendientes, setFVacPendientes] = useState('0')
  const [fMinistro, setFMinistro] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    const res = await fetch(`/api/remuneraciones/terminaciones?empresa_id=${empresa_id}`)
    if (res.ok) setTerminaciones(await res.json())
    setCargando(false)
  }, [empresa_id])

  useEffect(() => { cargar() }, [cargar])

  const trabajadorSeleccionado = trabajadores.find((t) => t.id === fTrabajador)
  const contrato = trabajadorSeleccionado?.contrato_activo
  const sueldoBase = contrato?.sueldo_base ?? 0

  // Indemnización: 1 mes por año de servicio (art. 163 CT)
  const indemnizacionCalculada = parseInt(fIndemnAnios) * sueldoBase
  const vacacionesMonto = Math.round((sueldoBase / 30) * parseInt(fVacPendientes || '0'))
  const totalFiniquito = indemnizacionCalculada + vacacionesMonto

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fTrabajador || !fFechaTermino) { setError('Trabajador y fecha de término son requeridos'); return }
    if (!contrato) { setError('El trabajador no tiene contrato activo'); return }
    setGuardando(true)
    try {
      const res = await fetch('/api/remuneraciones/terminaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id,
          trabajador_id: fTrabajador,
          contrato_id: contrato.id,
          fecha_termino: fFechaTermino,
          causal: fCausal,
          descripcion: fDescripcion || null,
          preaviso_dias: parseInt(fPreaviso) || 30,
          indemnizacion_anios: parseInt(fIndemnAnios) || 0,
          indemnizacion_monto: indemnizacionCalculada,
          vacaciones_pendientes: parseInt(fVacPendientes) || 0,
          monto_total_finiquito: totalFiniquito,
          ministro_de_fe: fMinistro || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMostrarForm(false)
      cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function marcarFirmado(id: string) {
    await fetch('/api/remuneraciones/terminaciones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, firmado: true, fecha_firma: new Date().toISOString().split('T')[0] }),
    })
    cargar()
  }

  const terminacionParaFiniquito = finiquitoId ? terminaciones.find((t) => t.id === finiquitoId) : null

  return (
    <div className="space-y-4">
      {/* Acción */}
      <div className="flex justify-end">
        <button onClick={() => setMostrarForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar terminación
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Registrar terminación de contrato</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Trabajador <span className="text-red-500">*</span></label>
              <select value={fTrabajador} onChange={(e) => setFTrabajador(e.target.value)} required
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">— Seleccionar —</option>
                {trabajadores.filter((t) => t.is_active && t.contrato_activo).map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} {t.apellido_paterno} ({t.rut})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de término <span className="text-red-500">*</span></label>
              <input type="date" value={fFechaTermino} onChange={(e) => setFFechaTermino(e.target.value)} required
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Causal</label>
              <select value={fCausal} onChange={(e) => setFCausal(e.target.value as CausalTerminacion)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <optgroup label="Art. 159 — Causales objetivas (no imputable)">
                  {CAUSALES_159.map((c) => <option key={c} value={c}>{CAUSAL_LABELS[c]}</option>)}
                </optgroup>
                <optgroup label="Art. 160 — Causales disciplinarias (sin indemnización)">
                  {CAUSALES_160.map((c) => <option key={c} value={c}>{CAUSAL_LABELS[c]}</option>)}
                </optgroup>
                <optgroup label="Art. 161 — Necesidades de la empresa">
                  <option value="161">{CAUSAL_LABELS['161']}</option>
                </optgroup>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Descripción / Fundamentación</label>
              <textarea value={fDescripcion} onChange={(e) => setFDescripcion(e.target.value)} rows={2}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {/* Cálculo indemnización */}
            <div className="md:col-span-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Liquidación y finiquito</p>
              {contrato && (
                <p className="text-xs text-slate-500 mb-3">Sueldo base: <strong>{formatCurrency(sueldoBase)}</strong></p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Años de servicio (para indemnización)</label>
              <input type="number" min="0" value={fIndemnAnios} onChange={(e) => setFIndemnAnios(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {parseInt(fIndemnAnios) > 0 && (
                <p className="text-xs text-slate-400 mt-1">Indemnización estimada: {formatCurrency(indemnizacionCalculada)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Días de vacaciones pendientes</label>
              <input type="number" min="0" value={fVacPendientes} onChange={(e) => setFVacPendientes(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {parseInt(fVacPendientes) > 0 && (
                <p className="text-xs text-slate-400 mt-1">Valor vacaciones: {formatCurrency(vacacionesMonto)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Días de preaviso</label>
              <input type="number" min="0" value={fPreaviso} onChange={(e) => setFPreaviso(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Ministro de fe (opcional)</label>
              <input type="text" value={fMinistro} onChange={(e) => setFMinistro(e.target.value)}
                placeholder="Nombre del ministro de fe"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {totalFiniquito > 0 && (
              <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-emerald-800">
                  Total finiquito estimado: <span className="tabular-nums">{formatCurrency(totalFiniquito)}</span>
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Indemnización {formatCurrency(indemnizacionCalculada)} + Vacaciones {formatCurrency(vacacionesMonto)}
                </p>
              </div>
            )}

            {error && <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setMostrarForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Registrar terminación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vista finiquito para imprimir */}
      {terminacionParaFiniquito && (
        <div className="bg-white border-2 border-slate-300 rounded-xl p-6 print:shadow-none" id="finiquito-print">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h3 className="text-sm font-semibold text-slate-700">Vista previa finiquito</h3>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                Imprimir
              </button>
              <button onClick={() => setFiniquitoId(null)} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                Cerrar
              </button>
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <h2 className="text-center text-base font-bold text-slate-900 uppercase">FINIQUITO DE CONTRATO</h2>
            <p className="text-center text-xs text-slate-500">Artículo {terminacionParaFiniquito.causal.replace('_', ' N°')} del Código del Trabajo</p>
            <div className="grid grid-cols-2 gap-3 text-xs border border-slate-200 rounded-lg p-4">
              <div><span className="font-medium text-slate-500">Trabajador:</span> <span className="text-slate-800">{terminacionParaFiniquito.trabajador?.nombre} {terminacionParaFiniquito.trabajador?.apellido_paterno}</span></div>
              <div><span className="font-medium text-slate-500">RUT:</span> <span className="text-slate-800">{terminacionParaFiniquito.trabajador?.rut}</span></div>
              <div><span className="font-medium text-slate-500">Fecha término:</span> <span className="text-slate-800">{formatDate(terminacionParaFiniquito.fecha_termino)}</span></div>
              <div><span className="font-medium text-slate-500">Causal:</span> <span className="text-slate-800">{CAUSAL_LABELS[terminacionParaFiniquito.causal]}</span></div>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50"><td className="px-4 py-2 font-medium text-slate-600">Indemnización por años de servicio</td><td className="px-4 py-2 text-right tabular-nums">{formatCurrency(terminacionParaFiniquito.indemnizacion_monto)}</td></tr>
                  <tr><td className="px-4 py-2 font-medium text-slate-600">Vacaciones pendientes ({terminacionParaFiniquito.vacaciones_pendientes} días)</td><td className="px-4 py-2 text-right tabular-nums">{formatCurrency(Math.round(terminacionParaFiniquito.monto_total_finiquito - terminacionParaFiniquito.indemnizacion_monto))}</td></tr>
                  <tr className="bg-emerald-50"><td className="px-4 py-2 font-bold text-slate-800">TOTAL FINIQUITO</td><td className="px-4 py-2 text-right font-bold tabular-nums text-emerald-700">{formatCurrency(terminacionParaFiniquito.monto_total_finiquito)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-slate-300 text-xs text-center text-slate-500">
              <div><div className="border-t border-slate-400 pt-2 mt-8">Firma empleador</div></div>
              <div><div className="border-t border-slate-400 pt-2 mt-8">Firma trabajador</div></div>
            </div>
            {terminacionParaFiniquito.ministro_de_fe && (
              <p className="text-center text-xs text-slate-500">Ministro de fe: {terminacionParaFiniquito.ministro_de_fe}</p>
            )}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Historial de terminaciones ({terminaciones.length})</h3>
        </div>
        {cargando ? (
          <p className="text-center py-8 text-slate-400 text-sm">Cargando...</p>
        ) : terminaciones.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">Sin terminaciones registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Trabajador</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha término</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Causal</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Total finiquito</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terminaciones.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-slate-800">
                    {t.trabajador ? `${t.trabajador.nombre} ${t.trabajador.apellido_paterno}` : '—'}
                    <div className="text-xs text-slate-400">{t.trabajador?.rut}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 tabular-nums">{formatDate(t.fecha_termino)}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{CAUSAL_LABELS[t.causal]}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-800">{formatCurrency(t.monto_total_finiquito)}</td>
                  <td className="px-4 py-2.5">
                    {t.firmado
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Firmado</span>
                      : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pendiente firma</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => setFiniquitoId(finiquitoId === t.id ? null : t.id)}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                        Ver finiquito
                      </button>
                      {!t.firmado && (
                        <button onClick={() => marcarFirmado(t.id)}
                          className="text-xs text-slate-500 hover:text-slate-700">
                          Marcar firmado
                        </button>
                      )}
                    </div>
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
