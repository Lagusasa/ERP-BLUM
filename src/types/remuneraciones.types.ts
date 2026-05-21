export interface AFP {
  id: string
  nombre: string
  tasa: number
  is_active: boolean
}

export interface Isapre {
  id: string
  nombre: string
  is_active: boolean
}

export interface Trabajador {
  id: string
  empresa_id: string
  rut: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string | null
  fecha_nacimiento: string | null
  genero: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  comuna: string | null
  ciudad: string | null
  afp_id: string | null
  isapre_id: string | null
  tipo_afiliacion: 'afp' | 'ips' | 'ninguno'
  is_active: boolean
  created_at: string
  afp?: AFP | null
  isapre?: Isapre | null
  contrato_activo?: Contrato | null
}

export interface Contrato {
  id: string
  empresa_id: string
  trabajador_id: string
  tipo_contrato: 'indefinido' | 'plazo_fijo' | 'obra' | 'honorarios' | 'part_time'
  cargo: string | null
  departamento: string | null
  fecha_inicio: string
  fecha_termino: string | null
  sueldo_base: number
  jornada_horas: number
  gratificacion_tipo: 'legal' | 'garantizada' | 'proporcional' | 'ninguna'
  es_activo: boolean
  created_at: string
}

export interface Liquidacion {
  id: string
  empresa_id: string
  trabajador_id: string
  contrato_id: string | null
  periodo_mes: number
  periodo_anio: number
  estado: 'borrador' | 'aprobada' | 'pagada' | 'anulada'
  sueldo_base: number
  horas_extra: number
  valor_hora_extra: number
  monto_horas_extra: number
  gratificacion: number
  otros_haberes_impon: number
  total_imponible: number
  asig_movilizacion: number
  asig_colacion: number
  viaticos: number
  otros_no_imponibles: number
  total_no_imponible: number
  afp_tasa: number
  afp_monto: number
  isapre_monto: number
  seguro_cesantia: number
  impuesto_2da_cat: number
  otros_descuentos: number
  total_descuentos: number
  sueldo_liquido: number
  aporte_scs: number
  aporte_mutualidad: number
  aporte_seguro_ces_emp: number
  dias_trabajados: number
  observaciones: string | null
  fecha_pago: string | null
  created_at: string
  trabajador?: Pick<Trabajador, 'nombre' | 'apellido_paterno' | 'rut'>
}

export interface LiquidacionCalculo {
  sueldo_base: number
  horas_extra: number
  valor_hora_extra: number
  monto_horas_extra: number
  gratificacion: number
  otros_haberes_impon: number
  total_imponible: number
  asig_movilizacion: number
  asig_colacion: number
  viaticos: number
  otros_no_imponibles: number
  total_no_imponible: number
  afp_tasa: number
  afp_monto: number
  isapre_monto: number
  seguro_cesantia: number
  impuesto_2da_cat: number
  total_descuentos: number
  sueldo_liquido: number
}

export const TIPO_CONTRATO_LABELS: Record<string, string> = {
  indefinido:  'Contrato Indefinido',
  plazo_fijo:  'Plazo Fijo',
  obra:        'Por Obra o Faena',
  honorarios:  'Honorarios',
  part_time:   'Part Time',
}

export const ESTADO_LIQUIDACION_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  aprobada: 'Aprobada',
  pagada:   'Pagada',
  anulada:  'Anulada',
}
