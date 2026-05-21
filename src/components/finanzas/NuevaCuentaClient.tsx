'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TipoCuenta } from '@/types/finanzas.types'
import { TIPO_CUENTA_LABELS } from '@/types/finanzas.types'

interface Props { empresa_id: string }

export default function NuevaCuentaClient({ empresa_id }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    banco: '',
    tipo_cuenta: 'corriente' as TipoCuenta,
    numero_cuenta: '',
    moneda: 'USD',
    saldo_inicial: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/finanzas/cuentas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, saldo_inicial: Number(form.saldo_inicial), empresa_id }),
    })
    const json = await res.json()
    if (!json.ok) { setError(json.error ?? 'Error'); setLoading(false); return }
    router.push('/finanzas')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Banco / Institución</label>
        <input required value={form.banco} onChange={set('banco')}
          placeholder="Ej: Banco Chile, BCI, Santander…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de cuenta</label>
          <select value={form.tipo_cuenta} onChange={set('tipo_cuenta')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {(Object.keys(TIPO_CUENTA_LABELS) as TipoCuenta[]).map((t) => (
              <option key={t} value={t}>{TIPO_CUENTA_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
          <select value={form.moneda} onChange={set('moneda')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="USD">USD</option>
            <option value="CLP">CLP</option>
            <option value="EUR">EUR</option>
            <option value="UF">UF</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Número de cuenta</label>
        <input required value={form.numero_cuenta} onChange={set('numero_cuenta')}
          placeholder="Ej: 1234-5678-90"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Saldo inicial</label>
        <input required type="number" step="0.01" value={form.saldo_inicial} onChange={set('saldo_inicial')}
          placeholder="0.00"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          {loading ? 'Guardando…' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  )
}
