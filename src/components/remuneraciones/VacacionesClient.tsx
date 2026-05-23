'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Trabajador, Ausencia, TipoAusencia, EstadoAusencia } from '@/types/remuneraciones.types'
import { TIPO_AUSENCIA_LABELS } from '@/types/remuneraciones.types'
import { formatDate } from '@/lib/utils'

interface Props {
  empresa_id: string
  trabajadores: Trabajador[]
}

const ESTADO_COLORS: Record<EstadoAusencia, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
  anulada: 'bg-slate-100 text-slate-500',
}

const ESTADO_LABELS: Record<EstadoAusencia, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  anulada: 'Anulada',
}

const TIPOS_VACACIONES: TipoAusencia[] = ['vacaciones', 'permiso_goce', 'permiso_sin_goce']
const TIPOS_LICENCIA: TipoAusencia[] = ['licencia_medica', 'licencia_maternal', 'licencia_paternal', 'sala_cuna', 'fuero_maternal', 'otro']

export default function VacacionesClient({ empresa_id, trabajadores }: Props) {
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroTrabajador, setFiltroTrabajador] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [tab, setTab] = useState<'vacaciones' | 'licencias'>('vacaciones')

  // Form state
  const [fTrabajador, setFTrabajador] = useState('')
  const [fTipo, setFTipo] = useState<TipoAusencia>('vacaciones')
  const [fFechaInicio, setFFechaInicio] = useState('')
  const [fFechaFin, setFFechaFin] = useState('')
  const [fDiasHabiles, setFDiasHabiles] = useState('')
  const [fMotivo, setFMotivo] = useState('')
  const [fNumLicencia, setFNumLicencia] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tiposActivos = tab === 'vacaciones' ? TIPOS_VACACIONES : TIPOS_LICENCIA

  const cargar = useCallback(async () => {
    setCargando(true)
    const params = new URLSearchParams({ empresa_id })
    if (filtroTrabajador) params.set('trabajador_id', filtroTrabajador)
    if (filtroEstado) params.set('estado', filtroEstado)
    const res = await fetch(`/api/remuneraciones/ausencias?${params}`)
    if (res.ok) {
      const data: Ausencia[] = await res.json()
      // Filtrar por tab
      const tiposTab = tab === 'vacaciones' ? TIPOS_VACACIONES : TIPOS_LICENCIA
      setAusencias(data.filter((a) => tiposTab.includes(a.tipo)))
    }
    setCargando(false)
  }, [empresa_id, filtroTrabajador, filtroEstado, tab])

  useEffect(() => { cargar() }, [cargar])

  // Calcular días corridos entre dos fechas
  function calcularDiasCorridos(desde: string, hasta: string): number {
    if (!desde || !hasta) return 0
    const d1 = new Date(desde)
    const d2 = new Date(hasta)
    const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.round(diff) + 1)
  }

  const diasCorridos = calcularDiasCorridos(fFechaInicio, fFechaFin)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fTrabajador || !fFechaInicio || !fFechaFin) {
      setError('Trabajador, fecha inicio y fecha fin son requeridos')
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/remuneraciones/ausencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id,
          trabajador_id: fTrabajador,
          tipo: fTipo,
          fecha_inicio: fFechaInicio,
          fecha_fin: fFechaFin,
          dias_habiles: parseInt(fDiasHabiles) || diasCorridos,
          dias_corridos: diasCorridos,
          motivo: fMotivo || null,
          numero_licencia: fNumLicencia || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMostrarForm(false)
      setFTrabajador('')
      setFFechaInicio('')
      setFFechaFin('')
      setFDiasHabiles('')
      setFMotivo('')
      setFNumLicencia('')
      cargar()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEstado(id: string, estado: EstadoAusencia) {
    await fetch('/api/remuneraciones/ausencias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    cargar()
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['vacaciones', 'licencias'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setMostrarForm(false) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'vacaciones' ? 'Vacaciones y Permisos' : 'Licencias Médicas'}
          </button>
        ))}
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filtroTrabajador} onChange={(e) => setFiltroTrabajador(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos los trabajadores</option>
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre} {t.apellido_paterno}</option>
          ))}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
          <option value="anulada">Anulada</option>
        </select>
        <button onClick={() => { setMostrarForm(true); setFTipo(tiposActivos[0]) }}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {tab === 'vacaciones' ? 'Registrar vacación/permiso' : 'Registrar licencia'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {tab === 'vacaciones' ? 'Registrar vacación o permiso' : 'Registrar licencia médica'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Trabajador <span className="text-red-500">*</span></label>
              <select value={fTrabajador} onChange={(e) => setFTrabajador(e.target.value)} required
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">— Seleccionar —</option>
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} {t.apellido_paterno}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select value={fTipo} onChange={(e) => setFTipo(e.target.value as TipoAusencia)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {tiposActivos.map((t) => (
                  <option key={t} value={t}>{TIPO_AUSENCIA_LABELS[t]}</option>
                ))}
              </select>
            </div>
            {tab === 'licencias' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° Licencia</label>
                <input type="text" value={fNumLicencia} onChange={(e) => setFNumLicencia(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha inicio <span className="text-red-500">*</span></label>
              <input type="date" value={fFechaInicio} onChange={(e) => setFFechaInicio(e.target.value)} required
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha fin <span className="text-red-500">*</span></label>
              <input type="date" value={fFechaFin} onChange={(e) => setFFechaFin(e.target.value)} required
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Días hábiles</label>
              <input type="number" min="0" value={fDiasHabiles} onChange={(e) => setFDiasHabiles(e.target.value)}
                placeholder={diasCorridos > 0 ? String(diasCorridos) : ''}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {diasCorridos > 0 && (
              <div className="md:col-span-3 bg-slate-50 rounded-lg px-4 py-2 text-xs text-slate-600">
                Días corridos calculados: <strong>{diasCorridos}</strong>
              </div>
            )}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Motivo / Observación</label>
              <input type="text" value={fMotivo} onChange={(e) => setFMotivo(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {error && <div className="md:col-span-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <div className="md:col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setMostrarForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50">
                {guardando ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {cargando ? (
          <p className="text-center py-8 text-slate-400 text-sm">Cargando...</p>
        ) : ausencias.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">Sin registros.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Trabajador</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Desde</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Hasta</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Días háb.</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Días corr.</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
                <th className="px-4 py-2.5 text-xs font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ausencias.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-slate-800">
                    {a.trabajador ? `${a.trabajador.nombre} ${a.trabajador.apellido_paterno}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{TIPO_AUSENCIA_LABELS[a.tipo]}</td>
                  <td className="px-4 py-2.5 text-slate-600 tabular-nums">{formatDate(a.fecha_inicio)}</td>
                  <td className="px-4 py-2.5 text-slate-600 tabular-nums">{formatDate(a.fecha_fin)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{a.dias_habiles}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{a.dias_corridos}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[a.estado]}`}>
                      {ESTADO_LABELS[a.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      {a.estado === 'pendiente' && (
                        <>
                          <button onClick={() => cambiarEstado(a.id, 'aprobada')}
                            className="text-xs text-green-600 hover:text-green-800 font-medium">
                            Aprobar
                          </button>
                          <button onClick={() => cambiarEstado(a.id, 'rechazada')}
                            className="text-xs text-red-500 hover:text-red-700">
                            Rechazar
                          </button>
                        </>
                      )}
                      {a.estado === 'aprobada' && (
                        <button onClick={() => cambiarEstado(a.id, 'anulada')}
                          className="text-xs text-slate-500 hover:text-slate-700">
                          Anular
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
