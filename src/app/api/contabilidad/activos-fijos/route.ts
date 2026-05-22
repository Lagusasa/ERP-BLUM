import { NextRequest, NextResponse } from 'next/server'
import { getEmpresaActiva } from '@/lib/empresa'
import { getActivosFijos, createActivoFijo, updateActivoFijo } from '@/services/contabilidad.service'

export async function GET() {
  try {
    const empresa = await getEmpresaActiva()
    if (!empresa) return NextResponse.json({ error: 'Sin empresa' }, { status: 401 })
    const activos = await getActivosFijos(empresa.id)
    return NextResponse.json(activos)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const empresa = await getEmpresaActiva()
    if (!empresa) return NextResponse.json({ error: 'Sin empresa' }, { status: 401 })
    const body = await req.json()
    const activo = await createActivoFijo(empresa.id, body)
    return NextResponse.json(activo, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const empresa = await getEmpresaActiva()
    if (!empresa) return NextResponse.json({ error: 'Sin empresa' }, { status: 401 })
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    const activo = await updateActivoFijo(id, empresa.id, updates)
    return NextResponse.json(activo)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
