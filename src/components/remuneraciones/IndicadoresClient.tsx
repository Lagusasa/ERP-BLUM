'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IndicadoresPrevisionales } from '@/services/remuneraciones.service'
import type { AFP } from '@/types/remuneraciones.types'

interface Props {
  indicadores: IndicadoresPrevisionales
  afps: AFP[]
  empresa_id: string
  anio: number
}

function pct(v: number) { return (v * 100).toFixed(4) }
function fromPct(s: string) { return parseFloat(s) / 100 }

function AfpRow({ afp, onGuardar, guardando }: {
  afp: AFP
  onGuardar: (id: string, tasa: number) => Promise<void>
  guardando: boolean
}) {
  const [tasaLocal, setTasaLocal] = useState(pct(afp.tasa))
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex-1 text-sm font-medium text-slate-700">{afp.nombre}</span>
      <div className="flex items-center gap-2">
        <div className="relative w-28">
          <input
            type="number"
            step="0.0001"
            value={tasaLocal}
            onChange={(e) => setTasaLocal(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
        </div>
        <button
          onClick={() => onGuardar(afp.id, fromPct(tasaLocal))}
          disabled={guardando}
          className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50"
        >
          {guardando ? '…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export default function IndicadoresClient({ indicadores: init, afps: initAfps, empresa_id, anio }: Props) {
  const router = useRouter()

  const [ind, setInd]         = useState<IndicadoresPrevisionales>(init)
  const [afps, setAfps]       = useState<AFP[]>(initAfps)
  const [guardando, setGuardando] = useState(false)
  const [guardandoAfp, setGuardandoAfp] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [ok, setOk]           = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  function update(k: keyof IndicadoresPrevisionales, v: string | number) {
    setInd((p) => ({ ...p, [k]: v }))
    setOk(false)
  }

  async function guardarIndicadores() {
    setGuardando(true); setError(null); setOk(false)
    try {
      const res = await fetch('/api/remuneraciones/indicadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ind, empresa_id, anio }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Error'); }
      setOk(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setGuardando(false)
    }
  }

  async function sincronizar() {
    setSincronizando(true); setSyncMsg(null); setError(null); setOk(false)
    try {
      const res = await fetch('/api/remuneraciones/indicadores/sync')
      const d = await res.json()
      if (!d.ok) throw new Error(d.error ?? 'Error al sincronizar')
      setInd((p) => ({
        ...p,
        uf_referencia:  d.uf,
        utm:            d.utm,
        sueldo_minimo:  d.sueldo_minimo,
      }))
      const fecha = new Date(d.fecha_uf).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
      setSyncMsg(`Valores actualizados desde mindicador.cl (UF al ${fecha}). Recuerda guardar.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al sincronizar')
    } finally {
      setSincronizando(false)
    }
  }

  async function guardarAfp(id: string, tasa: number) {
    setGuardandoAfp(id)
    try {
      await fetch('/api/remuneraciones/afp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tasa }),
      })
      setAfps((p) => p.map((a) => a.id === id ? { ...a, tasa } : a))
    } finally {
      setGuardandoAfp(null)
    }
  }

  const field = (
    label: string,
    key: keyof IndicadoresPrevisionales,
    tipo: 'currency' | 'pct' | 'number' = 'currency',
    hint?: string
  ) => {
    const raw = ind[key] as number | null
    const display = tipo === 'pct' ? pct(raw ?? 0) : String(raw ?? '')
    return (
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
        <div className="relative">
          {tipo === 'currency' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>}
          <input
            type="number"
            step={tipo === 'pct' ? '0.0001' : '1'}
            value={display}
            onChange={(e) => {
              const v = tipo === 'pct' ? fromPct(e.target.value) : parseFloat(e.target.value)
              update(key, isNaN(v) ? 0 : v)
            }}
            className={`w-full text-sm border border-slate-300 rounded-lg py-2 pr-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${tipo === 'currency' ? 'pl-7' : 'pl-3'}`}
          />
          {tipo === 'pct' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>}
        </div>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Selector año */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Indicadores Previsionales</h2>
          <p className="text-sm text-slate-500">Valores aplicados en el cálculo de liquidaciones y honorarios.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={sincronizar}
            disabled={sincronizando}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
            title="Obtiene UF, UTM y Sueldo Mínimo desde mindicador.cl"
          >
            <svg className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {sincronizando ? 'Sincronizando…' : 'Sincronizar desde mindicador.cl'}
          </button>
          <form method="GET" className="flex items-center gap-2">
            <select name="anio" defaultValue={anio}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {[anio-1, anio, anio+1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="submit" className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg">Ver</button>
          </form>
        </div>
      </div>

      {/* Indicadores generales */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Valores Generales — {anio}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {field('Sueldo Mínimo', 'sueldo_minimo', 'currency', 'Monto mensual vigente')}
          {field('UF Referencia', 'uf_referencia', 'currency', 'Valor UF de referencia del mes')}
          {field('UTM', 'utm', 'currency', 'Unidad Tributaria Mensual')}
          {field('Tope Imponible (UF)', 'tope_imponible_uf', 'number', 'Actualmente 81.6 UF')}
          {field('Retención Honorarios', 'retencion_honorarios_pct', 'pct', 'Tasa de retención (ej: 13.75%)')}
          {field('Tasa SCS (empleador)', 'tasa_scs', 'pct', 'Seguro Complementario de Salud')}
          {field('Mutualidad (empleador)', 'tasa_mutualidad', 'pct', 'Seguro de accidentes del trabajo')}
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-600 mb-3">Seguro de Cesantía</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('Trabajador', 'tasa_seg_ces_trab', 'pct', '0.6% contrato indefinido/plazo')}
            {field('Empleador (Indefinido)', 'tasa_seg_ces_emp_indef', 'pct', '2.4% contrato indefinido')}
            {field('Empleador (Plazo Fijo)', 'tasa_seg_ces_emp_plazo', 'pct', '3.0% contrato plazo fijo')}
          </div>
        </div>

        {syncMsg && <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">{syncMsg}</p>}
        {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {ok      && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Indicadores guardados correctamente.</p>}

        <div className="flex justify-end">
          <button onClick={guardarIndicadores} disabled={guardando}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50">
            {guardando ? 'Guardando…' : 'Guardar Indicadores'}
          </button>
        </div>
      </div>

      {/* Tasas AFP */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Tasas AFP</h3>
        <p className="text-xs text-slate-400">Porcentaje de cotización obligatoria (% sobre sueldo imponible). Cambia anualmente.</p>
        <div className="divide-y divide-slate-100">
          {afps.map((afp) => (
            <AfpRow
              key={afp.id}
              afp={afp}
              onGuardar={guardarAfp}
              guardando={guardandoAfp === afp.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
