'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PlanCuenta, TipoComprobante, Comprobante } from '@/types/contabilidad.types'
import { TIPO_COMPROBANTE_LABELS } from '@/types/contabilidad.types'
import { formatCurrency, cn } from '@/lib/utils'

interface LineaForm {
  uid: string
  id?: string         // id real en DB si ya existía
  cuenta_id: string
  debe: string
  haber: string
  glosa: string
}

interface Props {
  comprobante: Comprobante
  empresa_id: string
  cuentas: PlanCuenta[]
}

const lineaVacia = (): LineaForm => ({
  uid: crypto.randomUUID(),
  cuenta_id: '',
  debe: '',
  haber: '',
  glosa: '',
})

export default function EditarComprobanteClient({ comprobante, empresa_id, cuentas }: Props) {
  const router = useRouter()
  const soloMetadata = comprobante.estado === 'aprobado'

  const [tipo, setTipo]       = useState<TipoComprobante>(comprobante.tipo)
  const [fecha, setFecha]     = useState(comprobante.fecha)
  const [glosa, setGlosa]     = useState(comprobante.glosa ?? '')
  const [referencia, setRef]  = useState(comprobante.referencia ?? '')
  const [lineas, setLineas]   = useState<LineaForm[]>(
    comprobante.lineas?.length
      ? comprobante.lineas
          .sort((a, b) => a.orden - b.orden)
          .map((l) => ({
            uid: l.id,
            id: l.id,
            cuenta_id: l.cuenta_id,
            debe: l.debe > 0 ? String(l.debe) : '',
            haber: l.haber > 0 ? String(l.haber) : '',
            glosa: l.glosa ?? '',
          }))
      : [lineaVacia(), lineaVacia()]
  )
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const totalDebe  = lineas.reduce((s, l) => s + (parseFloat(l.debe) || 0), 0)
  const totalHaber = lineas.reduce((s, l) => s + (parseFloat(l.haber) || 0), 0)
  const diferencia = totalDebe - totalHaber
  const balanceado = Math.abs(diferencia) < 0.01

  function actualizarLinea(uid: string, campo: keyof LineaForm, valor: string) {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.uid !== uid) return l
        const actualizada = { ...l, [campo]: valor }
        if (campo === 'debe' && valor) actualizada.haber = ''
        if (campo === 'haber' && valor) actualizada.debe = ''
        return actualizada
      })
    )
  }

  const getCuenta = useCallback(
    (id: string) => cuentas.find((c) => c.id === id),
    [cuentas]
  )

  async function guardar() {
    setError(null)
    if (!glosa.trim()) { setError('La glosa es obligatoria.'); return }

    if (!soloMetadata) {
      const lineasValidas = lineas.filter(
        (l) => l.cuenta_id && (parseFloat(l.debe) > 0 || parseFloat(l.haber) > 0)
      )
      if (lineasValidas.length < 2) {
        setError('El comprobante debe tener al menos 2 líneas con cuenta y monto.')
        return
      }
      if (!balanceado) {
        setError(`No está balanceado. Diferencia: ${formatCurrency(Math.abs(diferencia))}`)
        return
      }
    }

    setGuardando(true)
    try {
      const supabase = createClient()

      if (soloMetadata) {
        // Aprobado: solo glosa y referencia
        const { error: e } = await supabase
          .from('comprobantes')
          .update({ glosa: glosa.trim(), referencia: referencia.trim() || null })
          .eq('id', comprobante.id)
          .eq('empresa_id', empresa_id)
        if (e) throw new Error(e.message)
      } else {
        // Borrador: actualizar cabecera + reemplazar líneas
        const lineasValidas = lineas.filter(
          (l) => l.cuenta_id && (parseFloat(l.debe) > 0 || parseFloat(l.haber) > 0)
        )
        const nuevoTotalDebe  = lineasValidas.reduce((s, l) => s + (parseFloat(l.debe) || 0), 0)
        const nuevoTotalHaber = lineasValidas.reduce((s, l) => s + (parseFloat(l.haber) || 0), 0)

        const { error: eComp } = await supabase
          .from('comprobantes')
          .update({
            tipo,
            fecha,
            glosa: glosa.trim(),
            referencia: referencia.trim() || null,
            total_debe:  nuevoTotalDebe,
            total_haber: nuevoTotalHaber,
          })
          .eq('id', comprobante.id)
          .eq('empresa_id', empresa_id)
        if (eComp) throw new Error(eComp.message)

        // Borrar líneas existentes y reinsertar
        const { error: eDel } = await supabase
          .from('comprobante_lineas')
          .delete()
          .eq('comprobante_id', comprobante.id)
        if (eDel) throw new Error(eDel.message)

        const { error: eIns } = await supabase.from('comprobante_lineas').insert(
          lineasValidas.map((l, idx) => ({
            comprobante_id: comprobante.id,
            empresa_id,
            cuenta_id: l.cuenta_id,
            debe:  parseFloat(l.debe)  || 0,
            haber: parseFloat(l.haber) || 0,
            glosa: l.glosa.trim() || null,
            orden: idx,
          }))
        )
        if (eIns) throw new Error(eIns.message)
      }

      router.push(`/contabilidad/libro-diario/${comprobante.id}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Aviso si aprobado */}
      {soloMetadata && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>
            Este comprobante está <strong>aprobado</strong>. Para mantener la integridad contable,
            solo se puede modificar la glosa y la referencia. Para corregir montos o cuentas,
            crea un comprobante de corrección.
          </span>
        </div>
      )}

      {/* Cabecera */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Datos del comprobante</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de comprobante</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoComprobante)}
              disabled={soloMetadata}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              {Object.entries(TIPO_COMPROBANTE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={soloMetadata}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Glosa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={glosa}
              onChange={(e) => setGlosa(e.target.value)}
              placeholder="Descripción del comprobante..."
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Referencia</label>
            <input
              type="text"
              value={referencia}
              onChange={(e) => setRef(e.target.value)}
              placeholder="N° factura, boleta, etc. (opcional)"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Líneas — solo borrador */}
      {!soloMetadata && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Líneas contables</h2>
            <button
              onClick={() => setLineas((p) => [...p, lineaVacia()])}
              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Agregar línea
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Cuenta contable</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-slate-500 w-36">Debe</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-slate-500 w-36">Haber</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500 w-48">Glosa de línea</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineas.map((linea) => {
                  const cuentaSeleccionada = getCuenta(linea.cuenta_id)
                  return (
                    <tr key={linea.uid}>
                      <td className="px-4 py-2">
                        <select
                          value={linea.cuenta_id}
                          onChange={(e) => actualizarLinea(linea.uid, 'cuenta_id', e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">— Seleccionar cuenta —</option>
                          {cuentas.map((c) => (
                            <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                          ))}
                        </select>
                        {cuentaSeleccionada && (
                          <p className="text-xs text-slate-400 mt-0.5 pl-1">
                            {cuentaSeleccionada.saldo_normal} · {cuentaSeleccionada.clase}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" min="0" step="1"
                          value={linea.debe}
                          onChange={(e) => actualizarLinea(linea.uid, 'debe', e.target.value)}
                          placeholder="0"
                          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number" min="0" step="1"
                          value={linea.haber}
                          onChange={(e) => actualizarLinea(linea.uid, 'haber', e.target.value)}
                          placeholder="0"
                          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={linea.glosa}
                          onChange={(e) => actualizarLinea(linea.uid, 'glosa', e.target.value)}
                          placeholder="Descripción..."
                          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => {
                            if (lineas.length > 2) setLineas((p) => p.filter((l) => l.uid !== linea.uid))
                          }}
                          disabled={lineas.length <= 2}
                          className="p-1 text-slate-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                <tr>
                  <td className="px-4 py-2.5 text-xs font-semibold text-slate-600 text-right">Totales:</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={cn('font-bold tabular-nums text-sm', totalDebe > 0 ? 'text-slate-800' : 'text-slate-400')}>
                      {formatCurrency(totalDebe)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={cn('font-bold tabular-nums text-sm', totalHaber > 0 ? 'text-slate-800' : 'text-slate-400')}>
                      {formatCurrency(totalHaber)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5" colSpan={2}>
                    {(totalDebe > 0 || totalHaber > 0) && (
                      balanceado
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Balanceado
                          </span>
                        : <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                            Diferencia: {formatCurrency(Math.abs(diferencia))}
                          </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {error}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando || (!soloMetadata && !balanceado)}
          className="px-5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
