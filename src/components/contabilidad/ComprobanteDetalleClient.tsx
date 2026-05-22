'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  comprobante_id: string
  empresa_id: string
  estado: string
  numero: number
}

export default function ComprobanteDetalleClient({ comprobante_id, empresa_id, estado, numero }: Props) {
  const [procesando, setProcesando] = useState(false)
  const router = useRouter()

  async function aprobar() {
    setProcesando(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('comprobantes')
        .update({ estado: 'aprobado', aprobado_by: user?.id, aprobado_at: new Date().toISOString() })
        .eq('id', comprobante_id)
        .eq('empresa_id', empresa_id)
        .eq('estado', 'borrador')
      if (error) { alert(error.message); return }
      router.refresh()
    } finally {
      setProcesando(false)
    }
  }

  async function anular() {
    if (!confirm(`¿Confirmas que deseas anular el Comprobante #${numero}? Esta acción no se puede deshacer.`)) return
    setProcesando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('comprobantes')
        .update({ estado: 'anulado' })
        .eq('id', comprobante_id)
        .eq('empresa_id', empresa_id)
      if (error) { alert(error.message); return }
      router.push('/contabilidad/libro-diario')
    } finally {
      setProcesando(false)
    }
  }

  function imprimir() {
    window.print()
  }

  return (
    <div className="flex items-center justify-between print:hidden">
      <a
        href="/contabilidad/libro-diario"
        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        ← Volver al Libro Diario
      </a>

      <div className="flex items-center gap-2">
        <button
          onClick={imprimir}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Imprimir
        </button>

        {estado === 'borrador' && (
          <button
            onClick={aprobar}
            disabled={procesando}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {procesando ? 'Aprobando…' : 'Aprobar'}
          </button>
        )}

        {estado !== 'anulado' && (
          <button
            onClick={anular}
            disabled={procesando}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {procesando ? 'Anulando…' : 'Anular'}
          </button>
        )}
      </div>
    </div>
  )
}
