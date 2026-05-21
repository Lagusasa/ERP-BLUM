'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Trabajador } from '@/types/remuneraciones.types'
import { calcularLiquidacion, SUELDO_MINIMO } from '@/lib/remuneraciones-calc'
import { formatCurrency } from '@/lib/utils'

interface Props {
  empresa_id: string
  trabajadores: Trabajador[]
  mes: number
  anio: number
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function NuevaLiquidacionForm({ empresa_id, trabajadores, mes, anio }: Props) {
  const router = useRouter()
  const [trabajadorId, setTrabajadorId] = useState('')
  const [horasExtra, setHorasExtra] = useState('0')
  const [asigMovilizacion, setAsigMovilizacion] = useState('0')
  const [asigColacion, setAsigColacion] = useState('0')
  const [otrosDescuentos, setOtrosDescuentos] = useState('0')
  const [diasTrabajados, setDiasTrabajados] = useState('30')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trabajador = trabajadores.find((t) => t.id === trabajadorId)
  const contrato = trabajador?.contrato_activo

  const resultado = contrato && trabajador?.afp
    ? calcularLiquidacion({
        sueldoBase: contrato.sueldo_base,
        horasExtra: parseInt(horasExtra) || 0,
        afpTasa: trabajador.afp.tasa,
        isapreMonto: trabajador.isapre ? Math.round(contrato.sueldo_base * 0.07) : 0,
        asigMovilizacion: parseInt(asigMovilizacion) || 0,
        asigColacion: parseInt(asigColacion) || 0,
        otrosDescuentos: parseInt(otrosDescuentos) || 0,
        diasTrabajados: parseInt(diasTrabajados) || 30,
        gratificacionTipo: contrato.gratificacion_tipo,
      })
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!trabajadorId) { setError('Selecciona un trabajador'); return }
    if (!resultado) { setError('El trabajador no tiene AFP configurada'); return }

    setGuardando(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error: dbError } = await supabase.from('liquidaciones').insert({
        empresa_id,
        trabajador_id: trabajadorId,
        contrato_id: contrato?.id ?? null,
        periodo_mes: mes,
        periodo_anio: anio,
        estado: 'borrador',
        sueldo_base: resultado.sueldoBase,
        horas_extra: resultado.horasExtra,
        valor_hora_extra: resultado.valorHoraExtra,
        monto_horas_extra: resultado.montoHorasExtra,
        gratificacion: resultado.gratificacion,
        otros_haberes_impon: resultado.otrosHaberesImpon,
        total_imponible: resultado.totalImponible,
        asig_movilizacion: resultado.asigMovilizacion,
        asig_colacion: resultado.asigColacion,
        viaticos: resultado.viaticos,
        otros_no_imponibles: resultado.otrosNoImponibles,
        total_no_imponible: resultado.totalNoImponible,
        afp_tasa: resultado.afpTasa,
        afp_monto: resultado.afpMonto,
        isapre_monto: resultado.isapreMonto,
        seguro_cesantia: resultado.seguroCesantia,
        impuesto_2da_cat: resultado.impuesto2daCat,
        otros_descuentos: parseInt(otrosDescuentos) || 0,
        total_descuentos: resultado.totalDescuentos,
        sueldo_liquido: resultado.sueldoLiquido,
        aporte_scs: resultado.aporteSCS,
        aporte_mutualidad: resultado.aporteMutualidad,
        aporte_seguro_ces_emp: resultado.aporteSegCesEmp,
        dias_trabajados: parseInt(diasTrabajados) || 30,
        created_by: user?.id ?? null,
      })

      if (dbError) throw new Error(dbError.message)
      router.push('/remuneraciones/liquidaciones')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm text-emerald-900">
          Liquidación de remuneraciones — <strong>{MESES[mes - 1]} {anio}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Trabajador</h2>
            <select value={trabajadorId} onChange={(e) => setTrabajadorId(e.target.value)} required
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Seleccionar trabajador —</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.apellido_paterno} ({t.rut})
                </option>
              ))}
            </select>
            {contrato && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <p><span className="font-medium">Sueldo base:</span> {formatCurrency(contrato.sueldo_base)}</p>
                <p><span className="font-medium">AFP:</span> {trabajador?.afp?.nombre ?? '—'} ({trabajador?.afp?.tasa}%)</p>
                <p><span className="font-medium">Salud:</span> {trabajador?.isapre?.nombre ?? 'Sin cotización'}</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Variables del período</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Días Trabajados</label>
                <input type="number" min="1" max="31" value={diasTrabajados} onChange={(e) => setDiasTrabajados(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Horas Extra</label>
                <input type="number" min="0" value={horasExtra} onChange={(e) => setHorasExtra(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Asig. Movilización</label>
                <input type="number" min="0" step="1000" value={asigMovilizacion} onChange={(e) => setAsigMovilizacion(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Asig. Colación</label>
                <input type="number" min="0" step="1000" value={asigColacion} onChange={(e) => setAsigColacion(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Otros Descuentos</label>
                <input type="number" min="0" step="1000" value={otrosDescuentos} onChange={(e) => setOtrosDescuentos(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        {resultado && (
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Resumen Liquidación</h3>
            <div className="space-y-1 text-xs">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Haberes</p>
              <div className="flex justify-between"><span className="text-slate-600">Sueldo base</span><span className="tabular-nums">{formatCurrency(resultado.sueldoBase)}</span></div>
              {resultado.montoHorasExtra > 0 && <div className="flex justify-between"><span className="text-slate-600">Horas extra ({resultado.horasExtra}h)</span><span className="tabular-nums">{formatCurrency(resultado.montoHorasExtra)}</span></div>}
              {resultado.gratificacion > 0 && <div className="flex justify-between"><span className="text-slate-600">Gratificación</span><span className="tabular-nums">{formatCurrency(resultado.gratificacion)}</span></div>}
              <div className="flex justify-between font-medium text-slate-800 border-t border-slate-100 pt-1"><span>Total imponible</span><span className="tabular-nums">{formatCurrency(resultado.totalImponible)}</span></div>
              {resultado.asigMovilizacion > 0 && <div className="flex justify-between text-slate-600 mt-1"><span>Movilización</span><span className="tabular-nums">{formatCurrency(resultado.asigMovilizacion)}</span></div>}
              {resultado.asigColacion > 0 && <div className="flex justify-between text-slate-600"><span>Colación</span><span className="tabular-nums">{formatCurrency(resultado.asigColacion)}</span></div>}

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3 mb-2">Descuentos</p>
              <div className="flex justify-between text-red-600"><span>AFP ({resultado.afpTasa}%)</span><span className="tabular-nums">-{formatCurrency(resultado.afpMonto)}</span></div>
              <div className="flex justify-between text-red-600"><span>Salud (7%)</span><span className="tabular-nums">-{formatCurrency(resultado.isapreMonto)}</span></div>
              <div className="flex justify-between text-red-600"><span>Seg. Cesantía (0.6%)</span><span className="tabular-nums">-{formatCurrency(resultado.seguroCesantia)}</span></div>
              {resultado.impuesto2daCat > 0 && <div className="flex justify-between text-red-600"><span>Imp. 2da Categoría</span><span className="tabular-nums">-{formatCurrency(resultado.impuesto2daCat)}</span></div>}
              <div className="flex justify-between font-medium text-red-700 border-t border-slate-100 pt-1"><span>Total descuentos</span><span className="tabular-nums">-{formatCurrency(resultado.totalDescuentos)}</span></div>

              <div className="flex justify-between font-bold text-slate-900 border-t-2 border-slate-200 pt-2 mt-2 text-sm">
                <span>Sueldo Líquido</span>
                <span className="tabular-nums">{formatCurrency(resultado.sueldoLiquido)}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cargo Empleador</p>
                <div className="flex justify-between text-slate-500"><span>Seg. Cesantía emp. (2.4%)</span><span className="tabular-nums">{formatCurrency(resultado.aporteSegCesEmp)}</span></div>
                <div className="flex justify-between text-slate-500"><span>SCS (1%)</span><span className="tabular-nums">{formatCurrency(resultado.aporteSCS)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Mutualidad (0.93%)</span><span className="tabular-nums">{formatCurrency(resultado.aporteMutualidad)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={guardando || !resultado}
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Generar liquidación'}
        </button>
      </div>
    </form>
  )
}
