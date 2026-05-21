import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getMovimientos, getProductos, getBodegas } from '@/services/inventario.service'
import KardexClient from '@/components/inventario/KardexClient'

export const metadata: Metadata = { title: 'Kardex' }

export default async function KardexPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const [movimientos, productos, bodegas] = await Promise.all([
    getMovimientos(empresa.id),
    getProductos(empresa.id),
    getBodegas(empresa.id),
  ])

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Kardex / Movimientos</h1>
      <KardexClient
        movimientos={movimientos}
        productos={productos}
        bodegas={bodegas}
        empresa_id={empresa.id}
      />
    </div>
  )
}
