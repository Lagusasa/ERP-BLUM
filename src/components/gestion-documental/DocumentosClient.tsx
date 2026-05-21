'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DocumentoGestion, TipoDocumento } from '@/types/gestion-documental.types'
import { TIPO_DOC_LABELS } from '@/types/gestion-documental.types'
import { formatDate, cn } from '@/lib/utils'

interface Props {
  documentos: DocumentoGestion[]
  empresa_id: string
}

const TIPOS: Array<{ value: TipoDocumento | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  ...Object.entries(TIPO_DOC_LABELS).map(([v, l]) => ({ value: v as TipoDocumento, label: l })),
]

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentosClient({ documentos, empresa_id }: Props) {
  const router = useRouter()
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const filtrados = useMemo(() => {
    const term = busqueda.toLowerCase()
    return documentos.filter((d) => {
      const tipoOk = filtroTipo === 'todos' || d.tipo === filtroTipo
      const matchOk = !term || d.nombre.toLowerCase().includes(term) || (d.descripcion ?? '').toLowerCase().includes(term)
      return tipoOk && matchOk
    })
  }, [documentos, filtroTipo, busqueda])

  async function handleDelete(id: string) {
    setEliminando(id)
    try {
      const res = await fetch('/api/gestion-documental', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, empresa_id }),
      })
      const json = await res.json()
      if (!json.ok) setError(json.error ?? 'Error al eliminar')
      else router.refresh()
    } catch { setError('Error de conexión') }
    finally { setEliminando(null) }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span className="shrink-0">⚠</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {showForm && (
        <SubirDocumentoForm
          empresa_id={empresa_id}
          onSuccess={() => { setShowForm(false); router.refresh() }}
          onCancel={() => setShowForm(false)}
          onError={setError}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar documentos..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Subir documento
          </button>
        </div>

        {filtrados.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            {documentos.length === 0
              ? 'No hay documentos. Haz clic en "Subir documento" para agregar el primero.'
              : 'No hay documentos que coincidan con el filtro.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtrados.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <FileIcon mime={doc.mime_type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', tipoBadge(doc.tipo))}>
                      {TIPO_DOC_LABELS[doc.tipo]}
                    </span>
                    {doc.tamano && (
                      <span className="text-xs text-slate-400">{formatBytes(doc.tamano)}</span>
                    )}
                    <span className="text-xs text-slate-400">{formatDate(doc.created_at)}</span>
                  </div>
                  {doc.descripcion && <p className="text-xs text-slate-400 truncate mt-0.5">{doc.descripcion}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(doc.url_externo || doc.storage_path) && (
                    <a
                      href={doc.url_externo ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors"
                    >
                      Ver
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={eliminando === doc.id}
                    className="text-xs px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors disabled:opacity-50"
                  >
                    {eliminando === doc.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function tipoBadge(tipo: string): string {
  const map: Record<string, string> = {
    dte: 'bg-emerald-100 text-emerald-800',
    contrato: 'bg-purple-100 text-purple-700',
    liquidacion: 'bg-green-100 text-green-700',
    nomina: 'bg-teal-100 text-teal-700',
    certificado: 'bg-orange-100 text-orange-700',
    otro: 'bg-slate-100 text-slate-600',
  }
  return map[tipo] ?? 'bg-slate-100 text-slate-600'
}

function FileIcon({ mime }: { mime: string | null }) {
  if (mime?.includes('pdf')) {
    return (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
      </svg>
    )
  }
  if (mime?.includes('image')) {
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

// -----------------------------------------------------------------------
// Formulario de subida
// -----------------------------------------------------------------------

interface FormProps {
  empresa_id: string
  onSuccess: () => void
  onCancel: () => void
  onError: (msg: string) => void
}

function SubirDocumentoForm({ empresa_id, onSuccess, onCancel, onError }: FormProps) {
  const [tipo, setTipo] = useState<TipoDocumento>('otro')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [urlExterno, setUrlExterno] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [modo, setModo] = useState<'url' | 'archivo'>('url')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setUploading(true)

    try {
      let storage_path: string | null = null
      let mime_type: string | null = null
      let tamano: number | null = null

      if (modo === 'archivo' && file) {
        const supabase = createClient()
        const ext = file.name.split('.').pop()
        const path = `${empresa_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: storageErr } = await supabase.storage.from('documentos').upload(path, file)
        if (storageErr) throw new Error(`Error al subir: ${storageErr.message}`)
        storage_path = path
        mime_type = file.type || null
        tamano = file.size
      }

      const res = await fetch('/api/gestion-documental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id,
          tipo,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          url_externo: modo === 'url' ? (urlExterno.trim() || null) : null,
          storage_path,
          mime_type,
          tamano,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Error al guardar')
      onSuccess()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Nuevo documento</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDocumento)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {Object.entries(TIPO_DOC_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              required placeholder="Nombre del documento"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Descripción (opcional)</label>
          <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción breve"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        <div>
          <div className="flex items-center gap-4 mb-2">
            <label className="text-xs text-slate-500">Adjunto:</label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={modo === 'url'} onChange={() => setModo('url')} className="accent-blue-600" />
              <span className="text-xs text-slate-700">URL externa</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={modo === 'archivo'} onChange={() => setModo('archivo')} className="accent-blue-600" />
              <span className="text-xs text-slate-700">Subir archivo</span>
            </label>
          </div>

          {modo === 'url' ? (
            <input type="url" value={urlExterno} onChange={(e) => setUrlExterno(e.target.value)}
              placeholder="https://..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          ) : (
            <input type="file"
              accept=".pdf,.xml,.xlsx,.xls,.docx,.jpg,.png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-600 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100" />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={uploading}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors">
            {uploading ? 'Subiendo...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
