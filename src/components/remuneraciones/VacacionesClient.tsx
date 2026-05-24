'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Trabajador, Ausencia, TipoAusencia, EstadoAusencia } from '@/types/remuneraciones.types'
import { TIPO_AUSENCIA_LABELS } from '@/types/remuneraciones.types'
import { formatDate } from '@/lib/utils'

interface Props {
  empresa_id: string
  trabajadores: Trabajador[]
}

interface SaldoVacaciones {
  trabajador_id: string
  nombre: string
  rut: string
  fecha_inicio_contrato: string | null
  meses_trabajados: number
  dias_acumulados: number
  dias_usados: number
  dias_pendientes: number
  dias_disponibles: number
}

const ESTADO_COLORS: Record<EstadoAusencia, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  aprobada:  'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
  anulada:   'bg-slate-100 text-slate-500',
}

const ESTADO_LABELS: Record<EstadoAusencia, string> = {
  pendiente: 'Pendiente',
  aprobada:  'Aprobada',
  rechazada: 'Rechazada',
  anulada:   'Anulada',
}

const TIPOS_VACACIONES: TipoAusencia[] = ['vacaciones', 'permiso_goce', 'permiso_sin_goce']
const TIPOS_LICENCIA: TipoAusencia[]   = ['licencia_medica', 'licencia_maternal', 'licencia_paternal', 'sala_cuna', 'fuero_maternal', 'otro']

function SemáforoSaldo({ dias }: { dias: number }) {
  if (dias > 10) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">{dias} días</span>
  if (dias > 0)  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{dias} días</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{dias} días</span>
}

export default function VacacionesClient({ empresa_id, trabajadores }: Props) {
  const [ausencias, setAusencias]         = useState<Ausencia[]>([])
  const [saldos, setSaldos]               = useState<SaldoVacaciones[]>([])
  const [cargando, setCargando]           = useState(true)
  const [cargandoSaldos, setCargandoSaldos] = useState(false)
  const [filtroTrabajador, setFiltroTrabajador] = useState('')
  const [filtroEstado, setFiltroEstado]   = useState('')
  const [mostrarForm, setMostrarForm]     = useState(false)
  const [tab, setTab]                     = useState<'vacaciones' | 'licencias' | 'saldos'>('vacaciones')

  // Form state
  const [fTrabajador, setFTrabajador]   = useState('')
  const [fTipo, setFTipo]               = useState<TipoAusencia>('vacaciones')
  const [fFechaInicio, setFFechaInicio] = useState('')
  const [fFechaFin, setFFechaFin]       = useState('')
  const [fDiasHabiles, setFDiasHabiles] = useState('')
  const [fMotivo, setFMotivo]           = useState('')
  const [fNumLicencia, setFNumLicencia] = useState('')
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const tiposActivos = tab === 'licencias' ? TIPOS_LICENCIA : TIPOS_VACACIONES

  const saldoWorker = saldos.find((s) => s.trabajador_id === fTrabajador)

  const cargar = useCallback(async () => {
    setCargando(true)
    const params = new URLSearchParams({ empresa_id })
    if (filtroTrabajador) params.set('trabajador_id', filtroTrabajador)
    if (filtroEstado) params.set('estado', filtroEstado)
    const res = await fetch(`/api/remuneraciones/ausencias?${params}`)
    if (res.ok) {
      const data: Ausencia[] = await res.json()
      const tiposTab = tab === 'licencias' ? TIPOS_LICENCIA : TIPOS_VACACIONES
      setAusencias(data.filter((a) => tiposTab.includes(a.tipo)))
    }
    setCargando(false)
  }, [empresa_id, filtroTrabajador, filtroEstado, tab])

  const cargarSaldos = useCallback(async () => {
    setCargandoSaldos(true)
    const res = await fetch(`/api/remuneraciones/saldo-vacaciones?empresa_id=${empresa_id}`)
    const d = await res.json()
    if (d.ok) setSaldos(d.data)
    setCargandoSaldos(false)
  }, [empresa_id])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { cargarSaldos() }, [cargarSaldos])

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
    if (fFechaFin < fFechaInicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio')
      return
    }
    const diasHab = parseInt(fDiasHabiles) || diasCorridos
    if (fTipo === 'vacaciones' && saldoWorker && diasHab > saldoWorker.dias_disponibles) {
      if (!confirm(`El trabajador tiene ${saldoWorker.dias_disponibles} días disponibles, pero se están registrando ${diasHab} días. ¿Confirmar de todas formas?`)) return
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
          dias_habiles: diasHab,
          dias_corridos: diasCorridos,
          motivo: fMotivo || null,
          numero_licencia: fNumLicencia || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMostrarForm(false)
      setFTrabajador(''); setFFechaInicio(''); setFFechaFin('')
      setFDiasHabiles(''); setFMotivo(''); setFNumLicencia('')
      cargar()
      cargarSaldos()
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
    cargarSaldos()
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          { id: 'vacaciones', label: 'Vacaciones y Permisos' },
          { id: 'licencias',  label: 'Licencias Médicas' },
          { id: 'saldos',     label: 'Saldos por Trabajador' },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); setMostrarForm(false) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB SALDOS ── */}
      {tab === 'saldos' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Saldo de Vacaciones por Trabajador</h3>
              <p className="text-xs text-slate-400 mt-0.5">Calculado según Ley N°20.832: 15 días hábiles/año (1.25 días/mes). Más de 10 años: +1 día cada 3 años.</p>
            </div>
            <button onClick={cargarSaldos} disabled={cargandoSaldos}
              className="text-xs text-emerald-700 hover:text-emerald-900 disabled:opacity-50">
              {cargandoSaldos ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
          {cargandoSaldos ? (
            <p className="text-center py-8 text-slate-400 text-sm">Calculando saldos…</p>
          ) : saldos.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-sm">Sin trabajadores activos con contrato.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Trabajador</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Desde</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Meses</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Acumulados</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Usados</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Pendientes</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Disponibles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {saldos.map((s) => (
                  <tr key={s.trabajador_id} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-slate-800">{s.nombre}</p>
                      <p className="text-xs text-slate-400">{s.rut}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">
                      {s.fecha_inicio_contrato ? formatDate(s.fecha_inicio_contrato) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{s.meses_trabajados}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 font-medium">{s.dias_acumulados}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{s.dias_usados}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-amber-600">
                      {s.dias_pendientes > 0 ? s.dias_pendientes : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <SemáforoSaldo dias={s.dias_disponibles} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/> &gt;10 días</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/> 1–10 días</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/> Sin saldo</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TABS VACACIONES / LICENCIAS ── */}
      {tab !== 'saldos' && (
        <>
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
                  {/* Indicador de saldo al seleccionar un trabajador en tab vacaciones */}
                  {tab === 'vacaciones' && fTrabajador && saldoWorker && (
                    <div className={`mt-1.5 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                      saldoWorker.dias_disponibles > 10 ? 'bg-green-50 text-green-700' :
                      saldoWorker.dias_disponibles > 0  ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Saldo disponible: <strong>{saldoWorker.dias_disponibles} días hábiles</strong>
                      {saldoWorker.dias_pendientes > 0 && (
                        <span className="ml-1 text-amber-600">({saldoWorker.dias_pendientes} pendientes)</span>
                      )}
                    </div>
                  )}
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

          {/* Tabla ausencias */}
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
        </>
      )}
    </div>
  )
}
