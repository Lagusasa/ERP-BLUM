import { NextRequest, NextResponse } from 'next/server'
import { getEmpresaActiva } from '@/lib/empresa'
import { getPresupuestoVsReal, upsertPresupuesto } from '@/services/contabilidad.service'

export async function GET(req: NextRequest) {
  try {
    const empresa = await getEmpresaActiva()
    if (!empresa) return NextResponse.json({ error: 'Sin empresa' }, { status: 401 })
    const anio = Number(req.nextUrl.searchParams.get('anio') ?? new Date().getFullYear())
    const data = await getPresupuestoVsReal(empresa.id, anio)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const empresa = await getEmpresaActiva()
    if (!empresa) return NextResponse.json({ error: 'Sin empresa' }, { status: 401 })
    const { cuenta_id, anio, mes, monto } = await req.json()
    if (!cuenta_id || !anio || !mes) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    await upsertPresupuesto(empresa.id, cuenta_id, anio, mes, monto ?? 0)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
