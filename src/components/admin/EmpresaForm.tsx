'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EmpresaAdmin } from '@/services/admin.service'

interface Props {
  empresa?: EmpresaAdmin
}

export default function EmpresaForm({ empresa }: Props) {
  const router = useRouter()
  const isEditing = !!empresa

  const [razonSocial, setRazonSocial] = useState(empresa?.razon_social ?? '')
  const [rut, setRut] = useState(empresa?.rut ?? '')
  const [giro, setGiro] = useState(empresa?.giro ?? '')
  const [email, setEmail] = useState(empresa?.email ?? '')
  const [telefono, setTelefono] = useState(empresa?.telefono ?? '')
  const [direccion, setDireccion] = useState(empresa?.direccion ?? '')
  const [comuna, setComuna] = useState(empresa?.comuna ?? '')
  const [ciudad, setCiudad] = useState(empresa?.ciudad ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!razonSocial.trim()) { setError('La razón social es requerida.'); return }
    if (!rut.trim()) { setError('El RUT es requerido.'); return }

    setGuardando(true)
    try {
      const supabase = createClient()
      const payload = {
        razon_social: razonSocial.trim(),
        rut: rut.trim(),
        giro: giro.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        comuna: comuna.trim() || null,
        ciudad: ciudad.trim() || null,
      }

      if (isEditing) {
        const { error: dbError } = await supabase
          .from('empresas')
          .update(payload)
          .eq('id', empresa.id)
        if (dbError) throw new Error(dbError.message)
        router.push('/admin/empresas')
        router.refresh()
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        const { data: newEmpresa, error: dbError } = await supabase
          .from('empresas')
          .insert({ ...payload, is_active: true, created_by: user.id })
          .select('id')
          .single()
        if (dbError || !newEmpresa) throw new Error(dbError?.message ?? 'Error al crear empresa')

        const { data: rolAdmin } = await supabase
          .from('roles')
          .select('id')
          .eq('nombre', 'Administrador')
          .is('empresa_id', null)
          .maybeSingle()

        await supabase.from('empresa_usuarios').insert({
          empresa_id: newEmpresa.id,
          user_id: user.id,
          rol_id: rolAdmin?.id ?? null,
          is_active: true,
          created_by: user.id,
        })

        const res = await fetch('/api/empresa/switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ empresa_id: newEmpresa.id }),
        })
        if (!res.ok) console.warn('No se pudo activar la empresa automáticamente')

        router.push('/admin/empresas')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Datos de la empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social <span className="text-red-500">*</span></label>
            <input type="text" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} required
              placeholder="Empresa Ejemplo SpA"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">RUT <span className="text-red-500">*</span></label>
            <input type="text" value={rut} onChange={(e) => setRut(e.target.value)} required
              placeholder="76.123.456-7"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Giro Comercial</label>
            <input type="text" value={giro} onChange={(e) => setGiro(e.target.value)}
              placeholder="Servicios de consultoría"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@empresa.cl"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
              placeholder="+56 2 2345 6789"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Dirección</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Dirección</label>
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. Ejemplo 1234, Oficina 5"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Comuna</label>
            <input type="text" value={comuna} onChange={(e) => setComuna(e.target.value)}
              placeholder="Providencia"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ciudad</label>
            <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)}
              placeholder="Santiago"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={guardando}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
          {guardando ? 'Guardando...' : isEditing ? 'Actualizar empresa' : 'Crear empresa'}
        </button>
      </div>
    </form>
  )
}
