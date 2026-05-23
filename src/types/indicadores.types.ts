export interface IndicadoresPrevisionales {
  id?: string
  empresa_id: string
  anio: number
  sueldo_minimo: number
  uf_referencia: number | null
  utm: number | null
  tope_imponible_uf: number
  retencion_honorarios_pct: number
  tasa_seg_ces_trab: number
  tasa_seg_ces_emp_indef: number
  tasa_seg_ces_emp_plazo: number
  tasa_scs: number
  tasa_mutualidad: number
}

export const INDICADORES_DEFAULT: Omit<IndicadoresPrevisionales, 'id' | 'empresa_id' | 'anio'> = {
  sueldo_minimo: 500000,
  uf_referencia: 37000,
  utm: 66081,
  tope_imponible_uf: 81.6,
  retencion_honorarios_pct: 0.1375,
  tasa_seg_ces_trab: 0.006,
  tasa_seg_ces_emp_indef: 0.024,
  tasa_seg_ces_emp_plazo: 0.030,
  tasa_scs: 0.010,
  tasa_mutualidad: 0.0093,
}
