'use client'

import { useState, useMemo } from 'react'
import type { Cliente } from '@/types/compras.types'
import { formatRut, formatCurrency, cn } from '@/lib/utils'

interface Props {
  clientes: Cliente[]
  empresa_id: string
}

export default function ClientesClient({ clientes }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)

  const filtrados = useMemo(() => {
    const termino = busqueda.toLowerCase()
    return clientes.filter((c) => {
      const activo = !soloActivos || c.is_active
      const coincide =
        !busqueda ||
        c.razon_social.toLowerCase().includes(termino) ||
        c.rut.includes(termino) ||
        (c.email ?? '').toLowerCase().includes(termino)
      return activo && coincide
    })
  }, [clientes, busqueda, soloActivos])

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar por RUT, razón social o email..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={soloActivos} onChange={(e) => setSoloActivos(e.target.checked)} className="rounded border-slate-300" />
          Solo activos
        </label>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">RUT</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Razón Social</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Giro</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Email</th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Límite Crédito</th>
            <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtrados.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-slate-400">
                {clientes.length === 0 ? 'No hay clientes registrados.' : 'No se encontraron resultados.'}
              </td>
            </tr>
          ) : (
            filtrados.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatRut(c.rut)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{c.razon_social}</p>
                  {c.nombre_fantasia && <p className="text-xs text-slate-400">{c.nombre_fantasia}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{c.giro ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{c.email ?? '—'}</td>
                <td className="px-4 py-3 text-right text-xs text-slate-600">
                  {c.limite_credito ? formatCurrency(c.limite_credito) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
        {filtrados.length} de {clientes.length} clientes
      </div>
    </div>
  )
}
