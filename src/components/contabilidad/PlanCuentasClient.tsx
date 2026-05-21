'use client'

import { useState, useMemo } from 'react'
import type { PlanCuenta } from '@/types/contabilidad.types'
import { CLASE_CUENTA_LABELS } from '@/types/contabilidad.types'
import { cn } from '@/lib/utils'

interface Props {
  cuentas: PlanCuenta[]
}

const CLASE_COLORS: Record<string, string> = {
  activo:     'text-blue-700 bg-blue-50',
  pasivo:     'text-purple-700 bg-purple-50',
  patrimonio: 'text-indigo-700 bg-indigo-50',
  ingreso:    'text-green-700 bg-green-50',
  costo:      'text-orange-700 bg-orange-50',
  gasto:      'text-red-700 bg-red-50',
  orden:      'text-slate-700 bg-slate-100',
}

export default function PlanCuentasClient({ cuentas }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [claseActiva, setClaseActiva] = useState<string>('todas')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [expandirTodo, setExpandirTodo] = useState(false)

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

  return (
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
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          isEncabezado ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-blue-50/30',
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
