'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CuentaBancaria, TipoMovCaja } from '@/types/finanzas.types'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO, CATEGORIA_LABELS } from '@/types/finanzas.types'

interface Props { empresa_id: string; cuentas: CuentaBancaria[] }

export default function NuevoMovimientoClient({ empresa_id, cuentas }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    cuenta_id: cuentas[0]?.id ?? '',
    tipo: 'ingreso' as TipoMovCaja,
    categoria: CATEGORIAS_INGRESO[0],
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    referencia: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  function handleTipo(tipo: TipoMovCaja) {
    const categorias = tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO
    setForm((f) => ({ ...f, tipo, categoria: categorias[0] }))
  }

  const categorias = form.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cuenta_id) { setError('Selecciona una cuenta'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/finanzas/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        monto: Number(form.monto),
        referencia: form.referencia || null,
        conciliado: false,
        referencia_tabla: null,
        referencia_id: null,
        empresa_id,
      }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(false); return }
    router.push('/finanzas')
    router.refresh()
  }

  if (cuentas.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
        No hay cuentas bancarias activas. <a href="/finanzas/cuentas/nueva" className="underline font-medium">Crea una cuenta</a> primero.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
        <div className="flex gap-3">
          {(['ingreso', 'egreso'] as TipoMovCaja[]).map((t) => (
            <button key={t} type="button" onClick={() => handleTipo(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                form.tipo === t
                  ? t === 'ingreso' ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              {t === 'ingreso' ? '↑ Ingreso' : '↓ Egreso'}
            </button>
          ))}
        </div>
      </div>

      {/* Cuenta */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cuenta</label>
        <select required value={form.cuenta_id} onChange={set('cuenta_id')}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>{c.banco} — {c.numero_cuenta}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
          <select required value={form.categoria} onChange={set('categoria')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {categorias.map((c) => (
              <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>
            ))}
          </select>
        </div>
        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
          <input required type="date" value={form.fecha} onChange={set('fecha')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
        <input required value={form.descripcion} onChange={set('descripcion')}
          placeholder="Ej: Pago factura #1234"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
        <input required type="number" step="0.01" min="0.01" value={form.monto} onChange={set('monto')}
          placeholder="0.00"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Referencia opcional */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Referencia <span className="text-slate-400 font-normal">(opcional)</span></label>
        <input value={form.referencia} onChange={set('referencia')}
          placeholder="N° documento, cheque, etc."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className={`px-5 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 ${
            form.tipo === 'ingreso' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}>
          {loading ? 'Guardando…' : `Registrar ${form.tipo}`}
        </button>
      </div>
    </form>
  )
}
