import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import DevolucionIvaClient from '@/components/tributacion/DevolucionIvaClient'

export const metadata: Metadata = { title: 'Devolución IVA Exportadores' }

export default async function DevolucionIvaPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Devolución IVA Exportadores</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Control de solicitudes de devolución IVA por exportaciones (art. 36 Ley IVA) — Formulario 3600 SII.
        </p>
      </div>
      <DevolucionIvaClient empresa_id={empresa.id} />
    </div>
  )
}
