'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { UsuarioEmpresa } from '@/services/admin.service'
import { formatDate, cn } from '@/lib/utils'

interface Rol { id: string; nombre: string; es_sistema: boolean }

interface Props {
  usuarios: UsuarioEmpresa[]
  roles: Rol[]
  empresa_id: string
}

export default function UsuariosClient({ usuarios, roles, empresa_id }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [procesando, setProcesando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return usuarios.filter(
      (u) =>
        !busqueda ||
        (u.perfil?.email ?? '').toLowerCase().includes(t) ||
        (u.perfil?.nombre_completo ?? '').toLowerCase().includes(t)
    )
  }, [usuarios, busqueda])

  async function patch(id: string, body: object) {
    setProcesando(id); setError(null)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      const d = await res.json()
      if (!d.ok) { setError(d.error ?? 'Error'); return }
      router.refresh()
    } catch { setError('Error de conexión') } finally { setProcesando(null) }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar por nombre o email..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-500">Usuario</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-48">Rol</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-28">Desde</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500 w-28">Estado</th>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">No hay usuarios.</td>
              </tr>
            ) : (
              filtrados.map((u) => (
                <tr key={u.id} className={cn('hover:bg-slate-50 transition-colors', !u.is_active && 'opacity-60')}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                        u.is_active ? 'bg-emerald-100' : 'bg-slate-100')}>
                        <span className={cn('text-xs font-semibold',
                          u.is_active ? 'text-emerald-700' : 'text-slate-500')}>
                          {(u.perfil?.email ?? '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{u.perfil?.nombre_completo ?? '—'}</p>
                        <p className="text-xs text-slate-400">{u.perfil?.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.rol?.id ?? ''}
                      disabled={procesando === u.id}
                      onChange={(e) => patch(u.id, { rol_id: e.target.value || null })}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 bg-white"
                    >
                      <option value="">— Sin rol —</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}{r.es_sistema ? ' ★' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                      u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => patch(u.id, { is_active: !u.is_active })}
                      disabled={procesando === u.id}
                      className={cn('text-xs px-2.5 py-1 rounded-md font-medium transition-colors disabled:opacity-50 whitespace-nowrap',
                        u.is_active
                          ? 'bg-red-50 hover:bg-red-100 text-red-700'
                          : 'bg-green-50 hover:bg-green-100 text-green-700'
                      )}
                    >
                      {procesando === u.id ? '...' : u.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-400 text-right">
          {filtrados.length} de {usuarios.length} usuarios · ★ = rol del sistema
        </div>
      </div>
    </div>
  )
}
