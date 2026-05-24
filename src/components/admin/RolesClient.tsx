'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Rol {
  id: string
  nombre: string
  descripcion: string | null
  es_sistema: boolean
}

interface Props {
  roles: Rol[]
  empresa_id: string
}

const ROLES_PREDEFINIDOS = [
  { nombre: 'Administrador', descripcion: 'Acceso total al sistema.' },
  { nombre: 'Contador', descripcion: 'Acceso a Contabilidad, Tributación y Finanzas.' },
  { nombre: 'RRHH', descripcion: 'Acceso al módulo de Remuneraciones.' },
  { nombre: 'Bodega', descripcion: 'Acceso al módulo de Inventario.' },
  { nombre: 'Solo lectura', descripcion: 'Acceso de lectura a todos los módulos.' },
]

export default function RolesClient({ roles, empresa_id }: Props) {
  const router = useRouter()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Rol | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function abrirNuevo(pre?: { nombre: string; descripcion: string }) {
    setEditando(null)
    setNombre(pre?.nombre ?? '')
    setDescripcion(pre?.descripcion ?? '')
    setMostrarForm(true)
    setError(null)
  }

  function abrirEditar(rol: Rol) {
    setEditando(rol)
    setNombre(rol.nombre)
    setDescripcion(rol.descripcion ?? '')
    setMostrarForm(true)
    setError(null)
  }

  function cancelar() {
    setMostrarForm(false)
    setEditando(null)
    setNombre('')
    setDescripcion('')
    setError(null)
  }

  async function guardar() {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    setGuardando(true); setError(null)
    try {
      if (editando) {
        const res = await fetch('/api/admin/roles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editando.id, nombre, descripcion }),
        })
        const d = await res.json()
        if (!d.ok) throw new Error(d.error)
      } else {
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empresa_id, nombre, descripcion }),
        })
        const d = await res.json()
        if (!d.ok) throw new Error(d.error)
      }
      cancelar()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function desactivar(id: string) {
    if (!confirm('¿Desactivar este rol? Los usuarios con este rol quedarán sin rol asignado.')) return
    setProcesando(id)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: false }),
      })
      const d = await res.json()
      if (!d.ok) { setError(d.error); return }
      router.refresh()
    } finally { setProcesando(null) }
  }

  const sistemaRoles  = roles.filter((r) => r.es_sistema)
  const empresaRoles  = roles.filter((r) => !r.es_sistema)
  const predefinidosPendientes = ROLES_PREDEFINIDOS.filter(
    (p) => !roles.some((r) => r.nombre.toLowerCase() === p.nombre.toLowerCase())
  )

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Formulario crear/editar */}
      {mostrarForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {editando ? `Editar rol: ${editando.nombre}` : 'Nuevo rol'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="ej: Contador, Bodeguero..."
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción del rol..."
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={cancelar} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50">
              {guardando ? 'Guardando…' : editando ? 'Actualizar' : 'Crear rol'}
            </button>
          </div>
        </div>
      )}

      {/* Roles del sistema */}
      {sistemaRoles.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">Roles del Sistema</h3>
            <p className="text-xs text-slate-400 mt-0.5">Predefinidos por la plataforma. No editables.</p>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {sistemaRoles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{r.nombre}</p>
                    {r.descripcion && <p className="text-xs text-slate-400 mt-0.5">{r.descripcion}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">Sistema ★</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Roles de la empresa */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Roles de la Empresa</h3>
            <p className="text-xs text-slate-400 mt-0.5">Roles personalizados para esta empresa.</p>
          </div>
          <button onClick={() => abrirNuevo()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo rol
          </button>
        </div>

        {empresaRoles.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-sm">No hay roles personalizados. Crea uno o usa los predefinidos abajo.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {empresaRoles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{r.nombre}</p>
                    {r.descripcion && <p className="text-xs text-slate-400 mt-0.5">{r.descripcion}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => abrirEditar(r)}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium transition-colors">
                        Editar
                      </button>
                      <button onClick={() => desactivar(r.id)} disabled={procesando === r.id}
                        className="text-xs px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors disabled:opacity-50">
                        {procesando === r.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Roles predefinidos sugeridos */}
      {predefinidosPendientes.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Roles sugeridos — click para agregar</h3>
          <div className="flex flex-wrap gap-2">
            {predefinidosPendientes.map((p) => (
              <button key={p.nombre} onClick={() => abrirNuevo(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {p.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
