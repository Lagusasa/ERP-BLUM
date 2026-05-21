'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Comprobante } from '@/types/contabilidad.types'
import { TIPO_COMPROBANTE_LABELS, ESTADO_COMPROBANTE_LABELS } from '@/types/contabilidad.types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  comprobantes: Comprobante[]
  empresa_id: string
}

export default function LibroDiarioClient({ comprobantes, empresa_id }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [procesando, setProcesando] = useState<string | null>(null)
  const router = useRouter()

  const filtrados = useMemo(() => {
    return comprobantes.filter((c) => {
      const terminoBusq = busqueda.toLowerCase()
      const coincide =
        !busqueda ||
        c.glosa.toLowerCase().includes(terminoBusq) ||
        String(c.numero).includes(terminoBusq) ||
        (c.documento_ref ?? '').toLowerCase().includes(terminoBusq)

      const estadoOk = filtroEstado === 'todos' || c.estado === filtroEstado
      const tipoOk = filtroTipo === 'todos' || c.tipo === filtroTipo

      return coincide && estadoOk && tipoOk
    })
  }, [comprobantes, busqueda, filtroEstado, filtroTipo])

  const totalDebe = filtrados.reduce((s, c) => s + c.total_debe, 0)
  const totalHaber = filtrados.reduce((s, c) => s + c.total_haber, 0)

  async function aprobar(id: string) {
    setProcesando(id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('comprobantes').update({
        estado: 'aprobado',
        aprobado_by: user?.id,
        aprobado_at: new Date().toISOString(),
      }).eq('id', id).eq('empresa_id', empresa_id)
      router.refresh()
    } finally {
      setProcesando(null)
    }
  }

  async function anular(id: string) {
    if (!confirm('¿Confirmas que deseas anular este comprobante? Esta acción no se puede deshacer.')) return
    setProcesando(id)
    try {
      const supabase = createClient()
      await supabase.from('comprobantes').update({ estado: 'anulado' })
        .eq('id', id).eq('empresa_id', empresa_id)
      router.refresh()
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Filtros */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por N°, glosa o referencia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="aprobado">Aprobado</option>
          <option value="anulado">Anulado</option>
        </select>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">Todos los tipos</option>
          {Object.entries(TIPO_COMPROBANTE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-16">N°</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-28">Fecha</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Glosa</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 w-28">Tipo</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 w-32">Debe</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 w-32">Haber</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500 w-24">Estado</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-slate-500 w-28">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  No hay comprobantes que coincidan con los filtros.
                  <br />
                  <Link href="/contabilidad/libro-diario/nuevo" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                    Crear primer comprobante →
                  </Link>
                </td>
              </tr>
            ) : (
              filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{c.numero}</td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDate(c.fecha)}</td>
                  <td className="px-4 py-2.5 text-slate-700 max-w-xs">
                    <p className="truncate">{c.glosa}</p>
                    {c.documento_ref && (
                      <p className="text-xs text-slate-400 truncate">{c.documento_ref}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">
                    {TIPO_COMPROBANTE_LABELS[c.tipo]}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">
                    {formatCurrency(c.total_debe)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">
                    {formatCurrency(c.total_haber)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <EstadoBadge estado={c.estado} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {c.estado === 'borrador' && (
                        <button
                          onClick={() => aprobar(c.id)}
                          disabled={procesando === c.id}
                          className="text-xs px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                          title="Aprobar"
                        >
                          Aprobar
                        </button>
                      )}
                      {c.estado !== 'anulado' && (
                        <button
                          onClick={() => anular(c.id)}
                          disabled={procesando === c.id}
                          className="text-xs px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                          title="Anular"
                        >
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtrados.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-slate-600 text-right">
                  Totales ({filtrados.length} comprobantes):
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">
                  {formatCurrency(totalDebe)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-800">
                  {formatCurrency(totalHaber)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {Math.abs(totalDebe - totalHaber) < 0.01 ? (
                    <span className="text-xs text-green-600 font-medium">✓ Balanceado</span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">✗ Diferencia</span>
                  )}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    aprobado: 'bg-green-100 text-green-700',
    borrador: 'bg-amber-100 text-amber-700',
    anulado: 'bg-red-100 text-red-700',
  }
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', map[estado] ?? 'bg-slate-100 text-slate-600')}>
      {ESTADO_COMPROBANTE_LABELS[estado as keyof typeof ESTADO_COMPROBANTE_LABELS] ?? estado}
    </span>
  )
}
