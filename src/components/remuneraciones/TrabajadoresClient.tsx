'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Trabajador } from '@/types/remuneraciones.types'
import { formatRut, formatCurrency, cn } from '@/lib/utils'
import { TIPO_CONTRATO_LABELS } from '@/types/remuneraciones.types'

interface Props {
  trabajadores: Trabajador[]
}

export default function TrabajadoresClient({ trabajadores }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return trabajadores.filter(
      (w) =>
        !busqueda ||
        w.nombre.toLowerCase().includes(t) ||
        w.apellido_paterno.toLowerCase().includes(t) ||
        w.rut.includes(t)
    )
  }, [trabajadores, busqueda])

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar por RUT o nombre..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <Link href="/remuneraciones/trabajadores/nuevo"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo trabajador
        </Link>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">RUT</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Nombre</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Cargo</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Contrato</th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Sueldo Base</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">AFP</th>
            <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtrados.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-slate-400">
                {trabajadores.length === 0 ? 'No hay trabajadores registrados.' : 'No se encontraron resultados.'}
              </td>
            </tr>
          ) : (
            filtrados.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatRut(w.rut)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{w.nombre} {w.apellido_paterno}</p>
                  {w.email && <p className="text-xs text-slate-400">{w.email}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{w.contrato_activo?.cargo ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {w.contrato_activo ? TIPO_CONTRATO_LABELS[w.contrato_activo.tipo_contrato] : '—'}
                </td>
                <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-700">
                  {w.contrato_activo ? formatCurrency(w.contrato_activo.sueldo_base) : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{w.afp?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                    w.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {w.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
        {filtrados.length} de {trabajadores.length} trabajadores
      </div>
    </div>
  )
}
