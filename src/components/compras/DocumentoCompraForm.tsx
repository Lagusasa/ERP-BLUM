'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Proveedor, TipoDocumento } from '@/types/compras.types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  empresa_id: string
  proveedores: Proveedor[]
  tiposDocumento: TipoDocumento[]
}

export default function DocumentoCompraForm({ empresa_id, proveedores, tiposDocumento }: Props) {
  const router = useRouter()
  const [proveedorId, setProveedorId] = useState('')
  const [tipoDocId, setTipoDocId] = useState('')
  const [numeroDoc, setNumeroDoc] = useState('')
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0])
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [neto, setNeto] = useState('')
  const [exento, setExento] = useState('0')
  const [esAfecto, setEsAfecto] = useState(true)
  const [tasaIva, setTasaIva] = useState('19')
  const [referencia, setReferencia] = useState('')
  const [glosa, setGlosa] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const netoNum = parseFloat(neto) || 0
  const exentoNum = parseFloat(exento) || 0
  const tasaNum = parseFloat(tasaIva) || 19
  const ivaCalculado = esAfecto ? Math.round(netoNum * tasaNum / 100) : 0
  const totalCalculado = netoNum + ivaCalculado + exentoNum

  const tipoSeleccionado = tiposDocumento.find((t) => t.id === tipoDocId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!proveedorId) { setError('Selecciona un proveedor.'); return }
    if (!tipoDocId) { setError('Selecciona el tipo de documento.'); return }
    if (!numeroDoc.trim()) { setError('Ingresa el número de documento.'); return }
    if (netoNum <= 0 && exentoNum <= 0) { setError('El monto neto o exento debe ser mayor a 0.'); return }

    setGuardando(true)
    try {
      const supabase = createClient()
      const { error: dbError } = await supabase
        .from('documentos_compra')
        .insert({
          empresa_id,
          proveedor_id: proveedorId,
          tipo_documento_id: tipoDocId,
          numero_documento: numeroDoc.trim(),
          fecha_emision: fechaEmision,
          fecha_vencimiento: fechaVencimiento || null,
          neto: netoNum,
          exento: exentoNum,
          tasa_iva: tasaNum,
          es_afecto: esAfecto,
          referencia: referencia.trim() || null,
          glosa: glosa.trim() || null,
          estado: 'pendiente',
        })

      if (dbError) throw new Error(dbError.message)

      router.push('/compras/documentos')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Datos del documento</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Proveedor */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} required
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Seleccionar proveedor —</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.rut} — {p.razon_social}</option>
              ))}
            </select>
          </div>

          {/* Tipo documento */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Tipo de Documento <span className="text-red-500">*</span>
            </label>
            <select value={tipoDocId} onChange={(e) => {
              setTipoDocId(e.target.value)
              const tipo = tiposDocumento.find((t) => t.id === e.target.value)
              if (tipo) setEsAfecto(tipo.afecto_iva)
            }} required
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Seleccionar —</option>
              {tiposDocumento.map((t) => (
                <option key={t.id} value={t.id}>{t.codigo} — {t.nombre}</option>
              ))}
            </select>
          </div>

          {/* Número documento */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              N° Documento <span className="text-red-500">*</span>
            </label>
            <input type="text" value={numeroDoc} onChange={(e) => setNumeroDoc(e.target.value)}
              placeholder="123456" required
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Fecha emisión */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de Emisión <span className="text-red-500">*</span></label>
            <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} required
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Fecha vencimiento */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de Vencimiento</label>
            <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Montos */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Montos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Monto Neto (CLP)</label>
            <input type="number" min="0" step="1" value={neto} onChange={(e) => setNeto(e.target.value)}
              placeholder="0"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Monto Exento (CLP)</label>
            <input type="number" min="0" step="1" value={exento} onChange={(e) => setExento(e.target.value)}
              placeholder="0"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tasa IVA (%)</label>
            <select value={tasaIva} onChange={(e) => setTasaIva(e.target.value)} disabled={!esAfecto}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400">
              <option value="19">19% (General)</option>
              <option value="0">0% (Exento)</option>
            </select>
          </div>
        </div>

        {/* Resumen calculado */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Neto</span>
            <span className="tabular-nums font-medium">{formatCurrency(netoNum)}</span>
          </div>
          {exentoNum > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Exento</span>
              <span className="tabular-nums font-medium">{formatCurrency(exentoNum)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">IVA {tasaIva}%</span>
            <span className="tabular-nums font-medium">{formatCurrency(ivaCalculado)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(totalCalculado)}</span>
          </div>
        </div>
      </div>

      {/* Referencias */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Referencias opcionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Referencia / OC / N° Orden</label>
            <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)}
              placeholder="OC-001 / N° Orden de compra..."
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Glosa / Descripción</label>
            <input type="text" value={glosa} onChange={(e) => setGlosa(e.target.value)}
              placeholder="Descripción del documento..."
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={guardando}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50">
          {guardando ? 'Guardando...' : 'Registrar Documento'}
        </button>
      </div>
    </form>
  )
}
