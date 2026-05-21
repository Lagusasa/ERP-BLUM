'use client'

import { useState, useMemo } from 'react'
import type { UsuarioEmpresa } from '@/services/admin.service'
import { formatDate, cn } from '@/lib/utils'

interface Props {
  usuarios: UsuarioEmpresa[]
}

export default function UsuariosClient({ usuarios }: Props) {
  const [busqueda, setBusqueda] = useState('')

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return usuarios.filter(
      (u) =>
        !busqueda ||
        (u.perfil?.email ?? '').toLowerCase().includes(t) ||
        (u.perfil?.nombre_completo ?? '').toLowerCase().includes(t)
    )
  }, [usuarios, busqueda])

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar por nombre o email..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Usuario</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Rol</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Desde</th>
            <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtrados.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-slate-400">No hay usuarios.</td>
            </tr>
          ) : (
            filtrados.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-blue-600 text-xs font-semibold">
                        {(u.perfil?.email ?? '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{u.perfil?.nombre_completo ?? '—'}</p>
                      <p className="text-xs text-slate-400">{u.perfil?.email ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{u.rol?.nombre ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                    u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
        {filtrados.length} de {usuarios.length} usuarios
      </div>
    </div>
  )
}
