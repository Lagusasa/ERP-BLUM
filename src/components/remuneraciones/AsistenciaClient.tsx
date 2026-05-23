'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Trabajador, RegistroAsistencia } from '@/types/remuneraciones.types'
import { formatDate } from '@/lib/utils'

interface Props {
  empresa_id: string
  trabajadores: Trabajador[]
}

const hoy = new Date().toISOString().split('T')[0]
const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

const TIPO_LABELS: Record<string, string> = {
  entrada: 'Jornada completa',
  hora_extra: 'Hora extra',
  ausencia: 'Ausencia',
  salida: 'Salida anticipada',
}

const TIPO_COLORS: Record<string, string> = {
  entrada: 'bg-green-100 text-green-700',
  hora_extra: 'bg-blue-100 text-blue-700',
  ausencia: 'bg-red-100 text-red-700',
  salida: 'bg-amber-100 text-amber-700',
}

export default function AsistenciaClient({ empresa_id, trabajadores }: Props) {
  const [registros, setRegistros] = useState<RegistroAsistencia[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroTrabajador, setFiltroTrabajador] = useState('')
  const [fechaDesde, setFechaDesde] = useState(inicioMes)
  const [fechaHasta, setFechaHasta] = useState(hoy)
  const [mostrarForm, setMostrarForm] = useState(false)

  // Form state
  const [fTrabajador, setFTrabajador] = useState('')
  const [fFecha, setFFecha] = useState(hoy)
  const [fHoraEntrada, setFHoraEntrada] = useState('08:00')
  const [fHoraSalida, setFHoraSalida] = useState('18:00')
  const [fHorasExtra, setFHorasExtra] = useState('0')
  const [fTipo, setFTipo] = useState<'entrada' | 'hora_extra' | 'ausencia' | 'salida'>('entrada')
  const [fObservacion, setFObservacion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarRegistros = useCallback(async () => {
    setCargando(true)
    const params = new URLSearchParams({ empresa_id, fecha_desde: fechaDesde, fecha_hasta: fechaHasta })
    if (filtroTrabajador) params.set('trabajador_id', filtroTrabajador)
    const res = await fetch(`/api/remuneraciones/asistencia?${params}`)
    if (res.ok) setRegistros(await res.json())
    setCargando(false)
  }, [empresa_id, fechaDesde, fechaHasta, filtroTrabajador])

  useEffect(() => { cargarRegistros() }, [cargarRegistros])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fTrabajador) { setError('Selecciona un trabajador'); return }
    setGuardando(true)
    try {
      const res = await fetch('/api/remuneraciones/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id,
          trabajador_id: fTrabajador,
          fecha: fFecha,
          hora_entrada: fTipo !== 'ausencia' ? fHoraEntrada : null,
          hora_salida: fTipo !== 'ausencia' ? fHoraSalida : null,
          horas_extra: parseInt(fHorasExtra) || 0,
          tipo: fTipo,
          observacion: fObservacion || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMostrarForm(false)
      setFTrabajador('')
      setFFecha(hoy)
      setFHoraEntrada('08:00')
      setFHoraSalida('18:00')
      setFHorasExtra('0')
      setFTipo('entrada')
      setFObservacion('')
      cargarRegistros()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    await fetch(`/api/remuneraciones/asistencia?id=${id}`, { method: 'DELETE' })
    cargarRegistros()
  }

  // Resumen del período
  const totalHorasOrdinarias = registros.reduce((s, r) => s + r.horas_ordinarias, 0)
  const totalHorasExtra = registros.reduce((s, r) => s + r.horas_extra, 0)
  const totalAusencias = registros.filter((r) => r.tipo === 'ausencia').length

  return (
    <div className="space-y-4">
      {/* Filtros y acción */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filtroTrabajador} onChange={(e) => setFiltroTrabajador(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos los trabajadores</option>
          {trabajadores.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre} {t.apellido_paterno}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <span className="text-slate-400 text-sm">—</span>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar asistencia
        </button>
      </div>

      {/* KPIs período */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Horas ordinarias</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalHorasOrdinarias.toFixed(1)}</p>
          <p className="text-xs text-slate-400 mt-0.5">registradas en el período</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Horas extra</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalHorasExtra.toFixed(1)}</p>
          <p className="text-xs text-slate-400 mt-0.5">50% recargo s/ jornada</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Ausencias</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalAusencias}</p>
          <p className="text-xs text-slate-400 mt-0.5">días en el período</p>
        </div>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Registrar asistencia</h3>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
              <input type="date" value={fFecha} onChange={(e) => setFFecha(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
              <select value={fTipo} onChange={(e) => setFTipo(e.target.value as typeof fTipo)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="entrada">Jornada completa</option>
                <option value="hora_extra">Hora extra</option>
                <option value="ausencia">Ausencia</option>
                <option value="salida">Salida anticipada</option>
              </select>
            </div>
            {fTipo !== 'ausencia' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Hora entrada</label>
                  <input type="time" value={fHoraEntrada} onChange={(e) => setFHoraEntrada(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Hora salida</label>
                  <input type="time" value={fHoraSalida} onChange={(e) => setFHoraSalida(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Horas extra</label>
                  <input type="number" min="0" step="0.5" value={fHorasExtra} onChange={(e) => setFHorasExtra(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </>
            )}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Observación</label>
              <input type="text" value={fObservacion} onChange={(e) => setFObservacion(e.target.value)}
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
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">
            Registros ({registros.length})
          </h3>
        </div>
        {cargando ? (
          <p className="text-center py-8 text-slate-400 text-sm">Cargando...</p>
        ) : registros.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">Sin registros en el período.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Trabajador</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Tipo</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Entrada</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Salida</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Hrs. ord.</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Hrs. extra</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Observación</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 text-slate-800">
                    {r.trabajador ? `${r.trabajador.nombre} ${r.trabajador.apellido_paterno}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 tabular-nums">{formatDate(r.fecha)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[r.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                      {TIPO_LABELS[r.tipo] ?? r.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-slate-600 tabular-nums">{r.hora_entrada ?? '—'}</td>
                  <td className="px-4 py-2.5 text-center text-slate-600 tabular-nums">{r.hora_salida ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{r.horas_ordinarias.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {r.horas_extra > 0 ? <span className="text-blue-600 font-medium">{r.horas_extra.toFixed(1)}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{r.observacion ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => handleEliminar(r.id)}
                      className="text-xs text-red-500 hover:text-red-700">
                      Eliminar
                    </button>
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
