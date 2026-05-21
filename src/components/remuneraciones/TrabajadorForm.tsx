'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AFP, Isapre } from '@/types/remuneraciones.types'
import { TIPO_CONTRATO_LABELS } from '@/types/remuneraciones.types'
import { formatCurrency } from '@/lib/utils'
import { calcularLiquidacion, SUELDO_MINIMO } from '@/lib/remuneraciones-calc'

interface Props {
  empresa_id: string
  afps: AFP[]
  isapres: Isapre[]
}

export default function TrabajadorForm({ empresa_id, afps, isapres }: Props) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Datos personales
  const [rut, setRut] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellidoPaterno, setApellidoPaterno] = useState('')
  const [apellidoMaterno, setApellidoMaterno] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [afpId, setAfpId] = useState('')
  const [isapredId, setIsapreId] = useState('')

  // Contrato
  const [tipoContrato, setTipoContrato] = useState('indefinido')
  const [cargo, setCargo] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0])
  const [sueldoBase, setSueldoBase] = useState(String(SUELDO_MINIMO))
  const [gratificacionTipo, setGratificacionTipo] = useState('legal')

  const sueldoNum = parseInt(sueldoBase) || 0
  const afpSeleccionada = afps.find((a) => a.id === afpId)
  const isapreSeleccionada = isapres.find((i) => i.id === isapredId)

  const preview = sueldoNum > 0 && afpSeleccionada
    ? calcularLiquidacion({
        sueldoBase: sueldoNum,
        afpTasa: afpSeleccionada.tasa,
        isapreMonto: isapreSeleccionada ? Math.round(sueldoNum * 0.07) : 0,
        gratificacionTipo: gratificacionTipo as 'legal' | 'garantizada' | 'proporcional' | 'ninguna',
      })
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!rut.trim()) { setError('RUT requerido'); return }
    if (!nombre.trim()) { setError('Nombre requerido'); return }
    if (!apellidoPaterno.trim()) { setError('Apellido paterno requerido'); return }
    if (sueldoNum < SUELDO_MINIMO) { setError(`Sueldo base mínimo: ${formatCurrency(SUELDO_MINIMO)}`); return }

    setGuardando(true)
    try {
      const supabase = createClient()

      const { data: trabajador, error: e1 } = await supabase
        .from('trabajadores')
        .insert({
          empresa_id,
          rut: rut.trim(),
          nombre: nombre.trim(),
          apellido_paterno: apellidoPaterno.trim(),
          apellido_materno: apellidoMaterno.trim() || null,
          email: email.trim() || null,
          telefono: telefono.trim() || null,
          afp_id: afpId || null,
          isapre_id: isapredId || null,
          tipo_afiliacion: afpId ? 'afp' : 'ninguno',
          is_active: true,
        })
        .select('id')
        .single()

      if (e1 || !trabajador) throw new Error(e1?.message ?? 'Error al crear trabajador')

      const { error: e2 } = await supabase
        .from('contratos')
        .insert({
          empresa_id,
          trabajador_id: trabajador.id,
          tipo_contrato: tipoContrato,
          cargo: cargo.trim() || null,
          fecha_inicio: fechaInicio,
          sueldo_base: sueldoNum,
          gratificacion_tipo: gratificacionTipo,
          jornada_horas: 45,
          es_activo: true,
        })

      if (e2) throw new Error(e2.message)

      router.push('/remuneraciones/trabajadores')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Datos personales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">RUT <span className="text-red-500">*</span></label>
                <input type="text" value={rut} onChange={(e) => setRut(e.target.value)} required
                  placeholder="12.345.678-9"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Apellido Paterno <span className="text-red-500">*</span></label>
                <input type="text" value={apellidoPaterno} onChange={(e) => setApellidoPaterno(e.target.value)} required
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Apellido Materno</label>
                <input type="text" value={apellidoMaterno} onChange={(e) => setApellidoMaterno(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
                <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Previsión</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">AFP</label>
                <select value={afpId} onChange={(e) => setAfpId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sin AFP —</option>
                  {afps.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre} ({a.tasa}%)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Isapre / Fonasa</label>
                <select value={isapredId} onChange={(e) => setIsapreId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Sin cotización salud —</option>
                  {isapres.map((i) => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Contrato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Contrato</label>
                <select value={tipoContrato} onChange={(e) => setTipoContrato(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(TIPO_CONTRATO_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cargo</label>
                <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej: Contador, Vendedor..."
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Inicio <span className="text-red-500">*</span></label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sueldo Base (CLP) <span className="text-red-500">*</span></label>
                <input type="number" min={SUELDO_MINIMO} step="1000" value={sueldoBase} onChange={(e) => setSueldoBase(e.target.value)} required
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo Gratificación</label>
                <select value={gratificacionTipo} onChange={(e) => setGratificacionTipo(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="legal">Gratificación Legal (25% de lo devengado, tope 4.75 IMM)</option>
                  <option value="garantizada">Gratificación Garantizada (25% de 1 IMM / 12)</option>
                  <option value="proporcional">Proporcional a días trabajados</option>
                  <option value="ninguna">Sin gratificación</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview liquidación */}
        <div className="space-y-4">
          {preview && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Preview Liquidación</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sueldo base</span><span className="tabular-nums">{formatCurrency(preview.sueldoBase)}</span>
                </div>
                {preview.gratificacion > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Gratificación</span><span className="tabular-nums">{formatCurrency(preview.gratificacion)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-slate-800 border-t border-slate-100 pt-1.5">
                  <span>Total imponible</span><span className="tabular-nums">{formatCurrency(preview.totalImponible)}</span>
                </div>
                <div className="flex justify-between text-red-600 mt-2">
                  <span>AFP ({preview.afpTasa}%)</span><span className="tabular-nums">-{formatCurrency(preview.afpMonto)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Salud (7%)</span><span className="tabular-nums">-{formatCurrency(preview.isapreMonto)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Seg. Cesantía</span><span className="tabular-nums">-{formatCurrency(preview.seguroCesantia)}</span>
                </div>
                {preview.impuesto2daCat > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Imp. 2da Cat.</span><span className="tabular-nums">-{formatCurrency(preview.impuesto2daCat)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2 text-sm">
                  <span>Sueldo Líquido</span><span className="tabular-nums">{formatCurrency(preview.sueldoLiquido)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={guardando}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Registrar trabajador'}
        </button>
      </div>
    </form>
  )
}
