import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function mesesEntre(fechaInicio: string, hasta: Date): number {
  const inicio = new Date(fechaInicio)
  const anios = hasta.getFullYear() - inicio.getFullYear()
  const meses = hasta.getMonth() - inicio.getMonth()
  const dias = hasta.getDate() - inicio.getDate()
  let totalMeses = anios * 12 + meses
  if (dias < 0) totalMeses -= 1
  return Math.max(0, totalMeses)
}

// Ley chilena: 15 días hábiles/año = 1.25 días/mes para trabajadores con < 10 años
// Después de 10 años: +1 día adicional por cada 3 años extra
function diasGanados(fechaInicio: string, hasta: Date): number {
  const meses = mesesEntre(fechaInicio, hasta)
  const anios = meses / 12

  let diasAnuales = 15
  if (anios >= 10) {
    const aniosExtra = Math.floor(anios - 10)
    diasAnuales += Math.floor(aniosExtra / 3)
  }

  return Math.floor((diasAnuales / 12) * meses)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const empresa_id = searchParams.get('empresa_id')
    if (!empresa_id) return NextResponse.json({ ok: false, error: 'empresa_id requerido' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })

    // Obtener trabajadores activos con su contrato activo
    const { data: trabajadores, error: tErr } = await supabase
      .from('trabajadores')
      .select(`
        id, nombre, apellido_paterno, rut,
        contratos:contratos(fecha_inicio, es_activo)
      `)
      .eq('empresa_id', empresa_id)
      .eq('is_active', true)

    if (tErr) throw new Error(tErr.message)

    // Obtener ausencias de vacaciones aprobadas y pendientes
    const { data: ausencias, error: aErr } = await supabase
      .from('ausencias')
      .select('trabajador_id, dias_habiles, estado, tipo')
      .eq('empresa_id', empresa_id)
      .eq('tipo', 'vacaciones')
      .in('estado', ['aprobada', 'pendiente'])

    if (aErr) throw new Error(aErr.message)

    const hoy = new Date()

    const saldos = (trabajadores ?? []).map((t) => {
      const contratosArr = t.contratos as unknown as { fecha_inicio: string; es_activo: boolean }[] | null
      const contratoActivo = (contratosArr ?? []).find((c) => c.es_activo)

      const fechaInicio = contratoActivo?.fecha_inicio ?? null
      const diasAcumulados = fechaInicio ? diasGanados(fechaInicio, hoy) : 0
      const mesesTrabajados = fechaInicio ? mesesEntre(fechaInicio, hoy) : 0

      const ausenciasTrabajador = (ausencias ?? []).filter((a) => a.trabajador_id === t.id)
      const diasUsados = ausenciasTrabajador.filter((a) => a.estado === 'aprobada').reduce((s, a) => s + (a.dias_habiles ?? 0), 0)
      const diasPendientes = ausenciasTrabajador.filter((a) => a.estado === 'pendiente').reduce((s, a) => s + (a.dias_habiles ?? 0), 0)
      const diasDisponibles = diasAcumulados - diasUsados

      return {
        trabajador_id: t.id,
        nombre: `${t.nombre} ${t.apellido_paterno}`,
        rut: t.rut,
        fecha_inicio_contrato: fechaInicio,
        meses_trabajados: mesesTrabajados,
        dias_acumulados: diasAcumulados,
        dias_usados: diasUsados,
        dias_pendientes: diasPendientes,
        dias_disponibles: diasDisponibles,
      }
    })

    return NextResponse.json({ ok: true, data: saldos })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
