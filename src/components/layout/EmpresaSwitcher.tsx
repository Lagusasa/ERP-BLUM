'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { EmpresaBasica } from '@/types/auth.types'
import { cn } from '@/lib/utils'

interface Props {
  empresas: EmpresaBasica[]
  empresaActiva: EmpresaBasica | null
}

export default function EmpresaSwitcher({ empresas, empresaActiva }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [cambiando, setCambiando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function switchEmpresa(id: string) {
    if (id === empresaActiva?.id || cambiando) return
    setCambiando(true)
    try {
      await fetch('/api/empresa/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id: id }),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setCambiando(false)
    }
  }

  const iniciales = (nombre: string) =>
    nombre.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  const nombreActiva = empresaActiva?.razon_social ?? 'Sin empresa'
  const rutActiva = empresaActiva?.rut ?? 'Seleccionar'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <div className="w-6 h-6 rounded bg-emerald-700 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{iniciales(nombreActiva)}</span>
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-medium text-slate-700 leading-none">{nombreActiva}</p>
          <p className="text-xs text-slate-400 mt-0.5">{rutActiva}</p>
        </div>
        <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 border-b border-slate-100">
            Empresas
          </p>
          <div className="max-h-64 overflow-y-auto">
            {empresas.map((e) => (
              <button
                key={e.id}
                onClick={() => switchEmpresa(e.id)}
                disabled={cambiando}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left',
                  e.id === empresaActiva?.id && 'bg-emerald-50'
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{iniciales(e.razon_social)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{e.razon_social}</p>
                  <p className="text-xs text-slate-400">{e.rut}</p>
                </div>
                {e.id === empresaActiva?.id && (
                  <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 p-2">
            <a
              href="/admin/empresas/nueva"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva empresa
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
