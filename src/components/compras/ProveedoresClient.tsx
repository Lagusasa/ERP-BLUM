'use client'

import { useState, useMemo } from 'react'
import type { Proveedor } from '@/types/compras.types'
import { formatRut, cn } from '@/lib/utils'

interface Props {
  proveedores: Proveedor[]
  empresa_id: string
}

export default function ProveedoresClient({ proveedores }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)

  const filtrados = useMemo(() => {
    const termino = busqueda.toLowerCase()
    return proveedores.filter((p) => {
      const activo = !soloActivos || p.is_active
      const coincide =
        !busqueda ||
        p.razon_social.toLowerCase().includes(termino) ||
        p.rut.includes(termino) ||
        (p.email ?? '').toLowerCase().includes(termino)
      return activo && coincide
    })
  }, [proveedores, busqueda, soloActivos])

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Filtros */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por RUT, razón social o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloActivos}
            onChange={(e) => setSoloActivos(e.target.checked)}
            className="rounded border-slate-300"
          />
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
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Teléfono</th>
            <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtrados.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-slate-400">
                {proveedores.length === 0 ? 'No hay proveedores registrados.' : 'No se encontraron resultados.'}
              </td>
            </tr>
          ) : (
            filtrados.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-700">{formatRut(p.rut)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{p.razon_social}</p>
                  {p.nombre_fantasia && <p className="text-xs text-slate-400">{p.nombre_fantasia}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{p.giro ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{p.email ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{p.telefono ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', p.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                    {p.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
        {filtrados.length} de {proveedores.length} proveedores
      </div>
    </div>
  )
}
