import { NextRequest, NextResponse } from 'next/server'
import { getEmpresaActiva } from '@/lib/empresa'
import { registrarDepreciacionMes } from '@/services/contabilidad.service'

export async function POST(req: NextRequest) {
  try {
    const empresa = await getEmpresaActiva()
    if (!empresa) return NextResponse.json({ error: 'Sin empresa' }, { status: 401 })
    const { anio, mes } = await req.json()
    if (!anio || !mes) return NextResponse.json({ error: 'anio y mes requeridos' }, { status: 400 })
    const resultado = await registrarDepreciacionMes(empresa.id, anio, mes)
    return NextResponse.json(resultado)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
