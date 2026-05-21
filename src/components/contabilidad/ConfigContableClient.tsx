'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanCuenta } from '@/types/contabilidad.types'
import type { ConfigContable } from '@/types/reportes.types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  empresa_id: string
  cuentas: PlanCuenta[]
  config: ConfigContable | null
}

const CAMPOS: { key: keyof Omit<ConfigContable, 'empresa_id'>; label: string; desc: string }[] = [
  { key: 'cuenta_cxc_id',     label: 'Cuentas por Cobrar',    desc: 'Para ventas: se debita al emitir facturas' },
  { key: 'cuenta_ingreso_id', label: 'Ingreso por Ventas',    desc: 'Para ventas: se acredita el neto + exento' },
  { key: 'cuenta_iva_df_id',  label: 'IVA Débito Fiscal',     desc: 'Para ventas: se acredita el IVA de ventas' },
  { key: 'cuenta_cxp_id',     label: 'Cuentas por Pagar',     desc: 'Para compras: se acredita al recibir facturas' },
  { key: 'cuenta_gasto_id',   label: 'Gasto / Compras',       desc: 'Para compras: se debita el neto + exento' },
  { key: 'cuenta_iva_cf_id',  label: 'IVA Crédito Fiscal',    desc: 'Para compras: se debita el IVA de compras' },
]

export default function ConfigContableClient({ empresa_id, cuentas, config }: Props) {
  const router = useRouter()
  const [valores, setValores] = useState<Record<string, string>>({
    cuenta_cxc_id:     config?.cuenta_cxc_id     ?? '',
    cuenta_ingreso_id: config?.cuenta_ingreso_id  ?? '',
    cuenta_iva_df_id:  config?.cuenta_iva_df_id   ?? '',
    cuenta_cxp_id:     config?.cuenta_cxp_id      ?? '',
    cuenta_gasto_id:   config?.cuenta_gasto_id    ?? '',
    cuenta_iva_cf_id:  config?.cuenta_iva_cf_id   ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cuentasImputables = cuentas.filter((c) => c.es_imputable && c.es_activo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    setOk(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const payload = {
        empresa_id,
        cuenta_cxc_id:     valores.cuenta_cxc_id     || null,
        cuenta_ingreso_id: valores.cuenta_ingreso_id  || null,
        cuenta_iva_df_id:  valores.cuenta_iva_df_id   || null,
        cuenta_cxp_id:     valores.cuenta_cxp_id      || null,
        cuenta_gasto_id:   valores.cuenta_gasto_id    || null,
        cuenta_iva_cf_id:  valores.cuenta_iva_cf_id   || null,
        updated_by: user?.id ?? null,
      }

      const { error: dbErr } = await supabase
        .from('config_contable')
        .upsert(payload, { onConflict: 'empresa_id' })

      if (dbErr) throw new Error(dbErr.message)
      setOk(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        Configure las cuentas contables que se usarán al centralizar documentos de compra y venta automáticamente.
        Solo aparecen cuentas imputables del plan de cuentas.
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Cuentas contables base</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {CAMPOS.map((campo) => (
            <div key={campo.key} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{campo.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{campo.desc}</p>
              </div>
              <div className="w-80">
                <select
                  value={valores[campo.key]}
                  onChange={(e) => setValores((prev) => ({ ...prev, [campo.key]: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Sin asignar —</option>
                  {cuentasImputables.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}
      {ok && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          Configuración guardada correctamente.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={guardando}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </form>
  )
}
