/**
 * Cálculos de remuneraciones según normativa chilena vigente.
 * Valores base 2024-2025: sueldo mínimo $500.000, gratificación legal 4.75%.
 */

export const SUELDO_MINIMO = 500000
export const TASA_SEGURO_CESANTIA_TRABAJADOR = 0.006
export const TASA_SEGURO_CESANTIA_EMPLEADOR = 0.024
export const TASA_SCS_EMPLEADOR = 0.01
export const TASA_MUTUALIDAD = 0.0093
export const ISAPRE_MINIMO = 24000 // 7% del sueldo mínimo aprox (cotización mínima)
export const FONASA_TASA = 0.07
export const TOPE_IMPONIBLE_UF = 81.6 // UF aprox tope imponible AFP/salud (estimado)
export const UF_VALOR = 38000 // valor UF estimado para cálculo (actualizar periódicamente)

// Tabla Impuesto 2da Categoría (UTM 2025 aprox $66.000)
// Tramos mensuales expresados en múltiplos de UTM
const UTM = 66000
const TRAMOS_IMP_2DA: { desde: number; hasta: number; tasa: number; rebaja: number }[] = [
  { desde: 0,         hasta: 13.5 * UTM,  tasa: 0,     rebaja: 0 },
  { desde: 13.5 * UTM, hasta: 30 * UTM,   tasa: 0.04,  rebaja: 13.5 * UTM * 0.04 },
  { desde: 30 * UTM,  hasta: 50 * UTM,    tasa: 0.08,  rebaja: 30 * UTM * 0.08 - 13.5 * UTM * 0.04 + 30 * UTM * 0.04 },
  { desde: 50 * UTM,  hasta: 70 * UTM,    tasa: 0.135, rebaja: 0 },
  { desde: 70 * UTM,  hasta: 90 * UTM,    tasa: 0.23,  rebaja: 0 },
  { desde: 90 * UTM,  hasta: 120 * UTM,   tasa: 0.304, rebaja: 0 },
  { desde: 120 * UTM, hasta: 310 * UTM,   tasa: 0.355, rebaja: 0 },
  { desde: 310 * UTM, hasta: Infinity,    tasa: 0.40,  rebaja: 0 },
]

export function calcularImpuesto2daCategoria(baseImponible: number): number {
  for (const t of TRAMOS_IMP_2DA) {
    if (baseImponible <= t.hasta) {
      const bruto = baseImponible * t.tasa - t.rebaja
      return Math.max(0, Math.round(bruto))
    }
  }
  return 0
}

export function calcularGratificacionLegal(sueldoBase: number): number {
  // Gratificación legal: 25% de lo devengado en el año / 12, tope 4.75 ingresos mínimos mensual
  const tope = SUELDO_MINIMO * 4.75 / 12
  return Math.min(Math.round(sueldoBase * 0.25 / 12), Math.round(tope / 12))
}

export interface InputLiquidacion {
  sueldoBase: number
  horasExtra?: number
  afpTasa: number        // ej: 10.44 (porcentaje)
  isapreMonto: number    // cotización fija isapre o 7% fonasa
  asigMovilizacion?: number
  asigColacion?: number
  viaticos?: number
  otrosHaberesImpon?: number
  otrosNoImponibles?: number
  otrosDescuentos?: number
  diasTrabajados?: number
  gratificacionTipo?: 'legal' | 'garantizada' | 'proporcional' | 'ninguna'
}

export interface ResultadoLiquidacion {
  sueldoBase: number
  horasExtra: number
  valorHoraExtra: number
  montoHorasExtra: number
  gratificacion: number
  otrosHaberesImpon: number
  totalImponible: number
  asigMovilizacion: number
  asigColacion: number
  viaticos: number
  otrosNoImponibles: number
  totalNoImponible: number
  afpTasa: number
  afpMonto: number
  isapreMonto: number
  seguroCesantia: number
  impuesto2daCat: number
  totalDescuentos: number
  sueldoLiquido: number
  aporteSCS: number
  aporteSegCesEmp: number
  aporteMutualidad: number
}

export function calcularLiquidacion(input: InputLiquidacion): ResultadoLiquidacion {
  const {
    sueldoBase,
    horasExtra = 0,
    afpTasa,
    isapreMonto,
    asigMovilizacion = 0,
    asigColacion = 0,
    viaticos = 0,
    otrosHaberesImpon = 0,
    otrosDescuentos = 0,
    diasTrabajados = 30,
    gratificacionTipo = 'legal',
  } = input

  const sueldoProporcional = diasTrabajados < 30
    ? Math.round(sueldoBase * diasTrabajados / 30)
    : sueldoBase

  // Horas extra: recargo 50% sobre valor hora ordinaria
  const valorHoraExtra = Math.round((sueldoProporcional / 30 / (45 / 5)) * 1.5)
  const montoHorasExtra = horasExtra * valorHoraExtra

  let gratificacion = 0
  if (gratificacionTipo === 'legal') {
    gratificacion = calcularGratificacionLegal(sueldoProporcional)
  } else if (gratificacionTipo === 'garantizada') {
    gratificacion = Math.round(SUELDO_MINIMO * 0.25 / 12)
  }

  const totalImponible = sueldoProporcional + montoHorasExtra + gratificacion + otrosHaberesImpon
  const totalNoImponible = asigMovilizacion + asigColacion + viaticos + (input.otrosNoImponibles ?? 0)

  // AFP: tasa sobre imponible con tope
  const topeImponibleAFP = TOPE_IMPONIBLE_UF * UF_VALOR
  const baseAFP = Math.min(totalImponible, topeImponibleAFP)
  const afpMonto = Math.round(baseAFP * afpTasa / 100)

  // Salud: cotización fija isapre o 7% fonasa
  const isapre = isapreMonto

  // Seguro de cesantía trabajador: 0.6%
  const seguroCesantia = Math.round(totalImponible * TASA_SEGURO_CESANTIA_TRABAJADOR)

  // Base impuesto 2da categoría
  const base2da = totalImponible - afpMonto - isapre - seguroCesantia
  const impuesto2daCat = calcularImpuesto2daCategoria(base2da)

  const totalDescuentos = afpMonto + isapre + seguroCesantia + impuesto2daCat + otrosDescuentos
  const sueldoLiquido = totalImponible + totalNoImponible - totalDescuentos

  // Aportes empleador
  const aporteSCS = Math.round(totalImponible * TASA_SCS_EMPLEADOR)
  const aporteSegCesEmp = Math.round(totalImponible * TASA_SEGURO_CESANTIA_EMPLEADOR)
  const aporteMutualidad = Math.round(totalImponible * TASA_MUTUALIDAD)

  return {
    sueldoBase: sueldoProporcional,
    horasExtra,
    valorHoraExtra,
    montoHorasExtra,
    gratificacion,
    otrosHaberesImpon,
    totalImponible,
    asigMovilizacion,
    asigColacion,
    viaticos,
    otrosNoImponibles: input.otrosNoImponibles ?? 0,
    totalNoImponible,
    afpTasa,
    afpMonto,
    isapreMonto: isapre,
    seguroCesantia,
    impuesto2daCat,
    totalDescuentos,
    sueldoLiquido: Math.max(0, sueldoLiquido),
    aporteSCS,
    aporteSegCesEmp,
    aporteMutualidad,
  }
}
