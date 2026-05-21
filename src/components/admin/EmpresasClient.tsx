'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { EmpresaAdmin } from '@/services/admin.service'
import { formatDate, cn } from '@/lib/utils'

interface Props {
  empresas: EmpresaAdmin[]
}

export default function EmpresasClient({ empresas }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtradas = useMemo(() => {
    const t = busqueda.toLowerCase()
    return empresas.filter(
      (e) =>
        !busqueda ||
        e.razon_social.toLowerCase().includes(t) ||
        e.rut.includes(t)
    )
  }, [empresas, busqueda])

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar por RUT o razón social..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <Link href="/admin/empresas/nueva"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva empresa
        </Link>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">RUT</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Razón Social</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Giro</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Email</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Creación</th>
            <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtradas.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-slate-400">
                {empresas.length === 0 ? 'No hay empresas registradas.' : 'No se encontraron resultados.'}
              </td>
            </tr>
          ) : (
            filtradas.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-700">{e.rut}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{e.razon_social}</td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{e.giro ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{e.email ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(e.created_at)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                    e.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {e.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/empresas/${e.id}`}
                    className="text-xs text-emerald-700 hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
        {filtradas.length} de {empresas.length} empresas
      </div>
    </div>
  )
}
