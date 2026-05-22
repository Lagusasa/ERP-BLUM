import { NextResponse } from 'next/server'

interface MindicadorResponse {
  uf:            { valor: number; fecha: string }
  utm:           { valor: number; fecha: string }
  sueldo_minimo: { valor: number; fecha: string }
}

export async function GET() {
  try {
    const res = await fetch('https://mindicador.cl/api', {
      next: { revalidate: 3600 }, // cache 1h
    })
    if (!res.ok) throw new Error(`mindicador.cl respondió ${res.status}`)

    const data = await res.json() as MindicadorResponse

    return NextResponse.json({
      ok: true,
      uf:            data.uf.valor,
      utm:           data.utm.valor,
      sueldo_minimo: data.sueldo_minimo.valor,
      fecha_uf:      data.uf.fecha,
      fecha_utm:     data.utm.fecha,
      fecha_sueldo:  data.sueldo_minimo.fecha,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Error al conectar con mindicador.cl' },
      { status: 502 }
    )
  }
}
