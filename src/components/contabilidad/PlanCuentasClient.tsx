'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PlanCuenta, ClaseCuenta } from '@/types/contabilidad.types'
import { CLASE_CUENTA_LABELS } from '@/types/contabilidad.types'
import { cn } from '@/lib/utils'

interface Props {
  cuentas: PlanCuenta[]
  empresa_id: string
}

const CLASE_COLORS: Record<string, string> = {
  activo:     'text-emerald-800 bg-emerald-50',
  pasivo:     'text-purple-700 bg-purple-50',
  patrimonio: 'text-indigo-700 bg-indigo-50',
  ingreso:    'text-green-700 bg-green-50',
  costo:      'text-orange-700 bg-orange-50',
  gasto:      'text-red-700 bg-red-50',
  orden:      'text-slate-700 bg-slate-100',
}

export default function PlanCuentasClient({ cuentas, empresa_id }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [claseActiva, setClaseActiva] = useState<string>('todas')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [expandirTodo, setExpandirTodo] = useState(false)
  const [showNueva, setShowNueva] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const cuentasMap = useMemo(() => {
    const map = new Map<string, PlanCuenta>()
    cuentas.forEach((c) => map.set(c.id, c))
    return map
  }, [cuentas])

  const arbol = useMemo(() => {
    const raices: PlanCuenta[] = []
    const hijos = new Map<string | null, PlanCuenta[]>()

    cuentas.forEach((c) => {
      const padre = c.cuenta_padre_id ?? null
      if (!hijos.has(padre)) hijos.set(padre, [])
      hijos.get(padre)!.push(c)
    })

    function construirArbol(padreId: string | null): PlanCuenta[] {
      return (hijos.get(padreId) ?? []).map((c) => ({
        ...c,
        hijos: construirArbol(c.id),
      }))
    }

    return construirArbol(null)
  }, [cuentas])

  const cuentasFiltradas = useMemo(() => {
    if (!busqueda && claseActiva === 'todas') return arbol

    const hayBusqueda = busqueda.trim().length > 0
    const termino = busqueda.toLowerCase()

    function filtrarNodo(nodo: PlanCuenta): PlanCuenta | null {
      const coincide =
        (!hayBusqueda ||
          nodo.codigo.toLowerCase().includes(termino) ||
          nodo.nombre.toLowerCase().includes(termino)) &&
        (claseActiva === 'todas' || nodo.clase === claseActiva)

      const hijosFiltr = (nodo.hijos ?? [])
        .map(filtrarNodo)
        .filter((h): h is PlanCuenta => h !== null)

      if (coincide || hijosFiltr.length > 0) {
        return { ...nodo, hijos: hijosFiltr }
      }
      return null
    }

    return arbol.map(filtrarNodo).filter((n): n is PlanCuenta => n !== null)
  }, [arbol, busqueda, claseActiva])

  function toggleExpandido(id: string) {
    setExpandidos((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }

  const clases = useMemo(() => {
    const set = new Set(cuentas.map((c) => c.clase))
    return Array.from(set)
  }, [cuentas])

  async function importarPlanEstandar() {
    setImporting(true)
    setImportError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('importar_plan_cuentas_template', { p_empresa_id: empresa_id })
      if (error) throw new Error(error.message)
      router.refresh()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="flex items-center gap-2 flex-wrap">
        {cuentas.length === 0 && (
          <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            Sin cuentas configuradas. Importa el plan estándar chileno o agrega cuentas manualmente.
          </div>
        )}
        <div className="ml-auto flex gap-2">
          {cuentas.length === 0 && (
            <button onClick={importarPlanEstandar} disabled={importing}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
              {importing ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Importando…</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>Importar Plan Estándar Chileno</>
              )}
            </button>
          )}
          <button onClick={() => setShowNueva(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Cuenta
          </button>
        </div>
        {importError && <p className="w-full text-xs text-red-600">{importError}</p>}
      </div>

      {showNueva && (
        <NuevaCuentaForm
          empresa_id={empresa_id}
          cuentas={cuentas}
          onCancel={() => setShowNueva(false)}
          onSave={() => { setShowNueva(false); router.refresh() }}
        />
      )}

    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Filtros */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setClaseActiva('todas')}
            className={cn('px-2.5 py-1 text-xs rounded-lg font-medium transition-colors', claseActiva === 'todas' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
          >
            Todas
          </button>
          {clases.map((c) => (
            <button
              key={c}
              onClick={() => setClaseActiva(c)}
              className={cn('px-2.5 py-1 text-xs rounded-lg font-medium transition-colors', claseActiva === c ? CLASE_COLORS[c] + ' ring-1 ring-current' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              {CLASE_CUENTA_LABELS[c as keyof typeof CLASE_CUENTA_LABELS] ?? c}
            </button>
          ))}
        </div>

        <button
          onClick={() => setExpandirTodo((p) => !p)}
          className="text-xs text-slate-500 hover:text-slate-700 ml-auto"
        >
          {expandirTodo ? '↑ Colapsar todo' : '↓ Expandir todo'}
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-36">Código</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Nombre</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-28">Clase</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-24">Tipo</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500 w-24">Saldo</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500 w-20">Imputable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuentasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  No se encontraron cuentas
                </td>
              </tr>
            ) : (
              cuentasFiltradas.map((cuenta) => (
                <CuentaRow
                  key={cuenta.id}
                  cuenta={cuenta}
                  nivel={0}
                  expandidos={expandidos}
                  expandirTodo={expandirTodo}
                  onToggle={toggleExpandido}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
        {cuentas.length} cuentas en total
      </div>
    </div>
    </div>
  )
}

// ─── Formulario nueva cuenta ───────────────────────────────────────────────────

function NuevaCuentaForm({
  empresa_id, cuentas, onCancel, onSave,
}: { empresa_id: string; cuentas: PlanCuenta[]; onCancel: () => void; onSave: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    clase: 'activo' as ClaseCuenta,
    tipo: 'detalle' as 'encabezado' | 'detalle',
    saldo_normal: 'deudor' as 'deudor' | 'acreedor',
    cuenta_padre_id: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const nivel = form.codigo.split('.').length

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/contabilidad/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id,
        codigo: form.codigo,
        nombre: form.nombre,
        clase: form.clase,
        tipo: form.tipo,
        nivel,
        saldo_normal: form.saldo_normal,
        es_imputable: form.tipo === 'detalle',
        cuenta_padre_id: form.cuenta_padre_id || null,
      }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(false); return }
    onSave()
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-slate-800">Nueva Cuenta</h3>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Código</label>
            <input required value={form.codigo} onChange={set('codigo')}
              placeholder="Ej: 1.1.05.01"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono" />
            <p className="text-xs text-slate-400 mt-0.5">Nivel detectado: {nivel}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
            <input required value={form.nombre} onChange={set('nombre')}
              placeholder="Ej: Caja Chica"
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Clase</label>
            <select value={form.clase} onChange={set('clase')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              {(Object.entries(CLASE_CUENTA_LABELS) as [ClaseCuenta, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
            <select value={form.tipo} onChange={set('tipo')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="detalle">Detalle (imputable)</option>
              <option value="encabezado">Encabezado (agrupador)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Saldo normal</label>
            <select value={form.saldo_normal} onChange={set('saldo_normal')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="deudor">Deudor</option>
              <option value="acreedor">Acreedor</option>
            </select>
          </div>
        </div>

        {cuentas.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cuenta Padre (opcional)</label>
            <select value={form.cuenta_padre_id} onChange={set('cuenta_padre_id')}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              <option value="">— Sin padre (cuenta raíz) —</option>
              {cuentas.filter(c => c.tipo === 'encabezado').map(c => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {loading ? 'Guardando…' : 'Crear Cuenta'}
          </button>
        </div>
      </form>
    </div>
  )
}

function CuentaRow({
  cuenta,
  nivel,
  expandidos,
  expandirTodo,
  onToggle,
}: {
  cuenta: PlanCuenta
  nivel: number
  expandidos: Set<string>
  expandirTodo: boolean
  onToggle: (id: string) => void
}) {
  const tieneHijos = (cuenta.hijos?.length ?? 0) > 0
  const expandido = expandirTodo || expandidos.has(cuenta.id)

  const isEncabezado = cuenta.tipo === 'encabezado'

  return (
    <>
      <tr
        className={cn(
          'transition-colors',
          isEncabezado ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-emerald-50/30',
          cuenta.nivel === 1 ? 'border-t-2 border-slate-200' : ''
        )}
      >
        <td className="px-4 py-2">
          <div className="flex items-center" style={{ paddingLeft: `${nivel * 16}px` }}>
            {tieneHijos ? (
              <button
                onClick={() => onToggle(cuenta.id)}
                className="w-4 h-4 mr-1.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  className={cn('transition-transform', expandido ? 'rotate-90' : 'rotate-0')}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="w-4 h-4 mr-1.5 shrink-0" />
            )}
            <span className={cn(
              'font-mono text-xs',
              isEncabezado ? 'font-bold text-slate-700' : 'text-slate-600'
            )}>
              {cuenta.codigo}
            </span>
          </div>
        </td>
        <td className="px-4 py-2">
          <span className={cn(
            isEncabezado ? 'font-semibold text-slate-800' : 'text-slate-700',
            cuenta.nivel === 1 ? 'text-sm uppercase tracking-wide' : 'text-sm'
          )}>
            {cuenta.nombre}
          </span>
        </td>
        <td className="px-4 py-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full', CLASE_COLORS[cuenta.clase] ?? 'bg-slate-100 text-slate-600')}>
            {CLASE_CUENTA_LABELS[cuenta.clase]}
          </span>
        </td>
        <td className="px-4 py-2 text-xs text-slate-500 capitalize">
          {cuenta.tipo}
        </td>
        <td className="px-4 py-2 text-center text-xs text-slate-500 capitalize">
          {cuenta.saldo_normal}
        </td>
        <td className="px-4 py-2 text-center">
          {cuenta.es_imputable ? (
            <svg className="w-4 h-4 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      </tr>
      {expandido && (cuenta.hijos ?? []).map((hijo) => (
        <CuentaRow
          key={hijo.id}
          cuenta={hijo}
          nivel={nivel + 1}
          expandidos={expandidos}
          expandirTodo={expandirTodo}
          onToggle={onToggle}
        />
      ))}
    </>
  )
}
