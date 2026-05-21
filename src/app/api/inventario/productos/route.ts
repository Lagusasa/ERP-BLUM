import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProducto } from '@/services/inventario.service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { empresa_id, sku, nombre, tipo, precio_compra, precio_venta, stock_minimo, afecto_iva } = body
  if (!empresa_id || !sku || !nombre) {
    return NextResponse.json({ ok: false, error: 'empresa_id, sku y nombre son requeridos' }, { status: 400 })
  }

  try {
    const producto = await createProducto(empresa_id, {
      sku, nombre,
      descripcion: body.descripcion ?? null,
      tipo: tipo ?? 'producto',
      categoria_id: body.categoria_id ?? null,
      unidad_id: body.unidad_id ?? null,
      precio_compra: precio_compra ?? 0,
      precio_venta: precio_venta ?? 0,
      stock_minimo: stock_minimo ?? 0,
      afecto_iva: afecto_iva ?? true,
      is_active: true,
    })
    return NextResponse.json({ ok: true, producto })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' })
  }
}
