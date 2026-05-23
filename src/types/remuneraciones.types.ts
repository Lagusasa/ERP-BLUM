export interface AFP {
  id: string
  nombre: string
  tasa: number          // tasa total (ej: 10.44)
  tasa_afp: number      // cotización obligatoria (10%)
  comision: number      // comisión AFP (ej: 0.44)
  sis: number           // prima SIS (Seguro Invalidez y Sobrevivencia, ~1.49%)
  is_active: boolean
}

export interface Mutualidad {
  id: string
  nombre: string        // ACHS, IST, Mutual de Seguridad, ISL
  tasa_base: number     // tasa básica Ley 16.744 (0.93%)
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
  mutualidad_id: string | null
  tipo_afiliacion: 'afp' | 'ips' | 'ninguno'
  is_active: boolean
  created_at: string
  afp?: AFP | null
  isapre?: Isapre | null
  mutualidad?: Mutualidad | null
  contrato_activo?: Contrato | null
}

export interface Contrato {
  id: string
  empresa_id: string
  trabajador_id: string
  tipo_contrato: 'indefinido' | 'plazo_fijo' | 'obra' | 'honorarios' | 'part_time'
  cargo: string | null
  departamento: string | null
  lugar_prestacion: string | null
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
  afp_comision: number
  afp_sis: number
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

// ─── ASISTENCIA ───────────────────────────────────────────────
export type TipoRegistroAsistencia = 'entrada' | 'salida' | 'hora_extra' | 'ausencia'

export interface RegistroAsistencia {
  id: string
  empresa_id: string
  trabajador_id: string
  fecha: string
  hora_entrada: string | null
  hora_salida: string | null
  horas_ordinarias: number
  horas_extra: number
  tipo: TipoRegistroAsistencia
  observacion: string | null
  created_at: string
  trabajador?: Pick<Trabajador, 'nombre' | 'apellido_paterno' | 'rut'>
}

export interface PactoHorasExtra {
  id: string
  empresa_id: string
  trabajador_id: string
  fecha_inicio: string
  fecha_termino: string | null
  horas_semana: number
  monto_hora: number
  is_active: boolean
  created_at: string
}

// ─── VACACIONES Y PERMISOS ───────────────────────────────────
export type TipoAusencia =
  | 'vacaciones'
  | 'permiso_goce'
  | 'permiso_sin_goce'
  | 'licencia_medica'
  | 'licencia_maternal'
  | 'licencia_paternal'
  | 'sala_cuna'
  | 'fuero_maternal'
  | 'otro'

export type EstadoAusencia = 'pendiente' | 'aprobada' | 'rechazada' | 'anulada'

export interface Ausencia {
  id: string
  empresa_id: string
  trabajador_id: string
  tipo: TipoAusencia
  fecha_inicio: string
  fecha_fin: string
  dias_habiles: number
  dias_corridos: number
  estado: EstadoAusencia
  motivo: string | null
  numero_licencia: string | null
  documento_url: string | null
  aprobado_por: string | null
  created_at: string
  trabajador?: Pick<Trabajador, 'nombre' | 'apellido_paterno' | 'rut'>
}

// ─── TERMINACIÓN DE CONTRATO ──────────────────────────────────
export type CausalTerminacion =
  | '159_1'  // mutuo acuerdo
  | '159_2'  // renuncia voluntaria
  | '159_3'  // muerte del trabajador
  | '159_4'  // vencimiento plazo
  | '159_5'  // conclusión obra/faena
  | '159_6'  // caso fortuito
  | '160_1'  // falta probidad
  | '160_2'  // acoso sexual/laboral
  | '160_3'  // vías de hecho
  | '160_4'  // injurias
  | '160_5'  // conducta inmoral
  | '160_6'  // negociaciones prohibidas
  | '160_7'  // ausencias injustificadas
  | '160_8'  // abandono de trabajo
  | '161'    // necesidades de la empresa

export interface TerminacionContrato {
  id: string
  empresa_id: string
  trabajador_id: string
  contrato_id: string
  fecha_termino: string
  causal: CausalTerminacion
  descripcion: string | null
  preaviso_dias: number
  indemnizacion_anios: number
  indemnizacion_monto: number
  vacaciones_pendientes: number
  monto_total_finiquito: number
  ministro_de_fe: string | null
  firmado: boolean
  fecha_firma: string | null
  created_at: string
  trabajador?: Pick<Trabajador, 'nombre' | 'apellido_paterno' | 'rut'>
}

export const CAUSAL_LABELS: Record<CausalTerminacion, string> = {
  '159_1': 'Art. 159 N°1 — Mutuo acuerdo',
  '159_2': 'Art. 159 N°2 — Renuncia voluntaria',
  '159_3': 'Art. 159 N°3 — Muerte del trabajador',
  '159_4': 'Art. 159 N°4 — Vencimiento de plazo',
  '159_5': 'Art. 159 N°5 — Conclusión obra o faena',
  '159_6': 'Art. 159 N°6 — Caso fortuito o fuerza mayor',
  '160_1': 'Art. 160 N°1 — Falta de probidad',
  '160_2': 'Art. 160 N°2 — Acoso sexual o laboral',
  '160_3': 'Art. 160 N°3 — Vías de hecho',
  '160_4': 'Art. 160 N°4 — Injurias al empleador',
  '160_5': 'Art. 160 N°5 — Conducta inmoral grave',
  '160_6': 'Art. 160 N°6 — Negociaciones prohibidas',
  '160_7': 'Art. 160 N°7 — Ausencias injustificadas',
  '160_8': 'Art. 160 N°8 — Abandono de trabajo',
  '161':   'Art. 161 — Necesidades de la empresa',
}

export const TIPO_AUSENCIA_LABELS: Record<TipoAusencia, string> = {
  vacaciones:        'Vacaciones legales',
  permiso_goce:      'Permiso con goce de sueldo',
  permiso_sin_goce:  'Permiso sin goce de sueldo',
  licencia_medica:   'Licencia médica',
  licencia_maternal: 'Pre/postnatal',
  licencia_paternal: 'Permiso paternal (5 días)',
  sala_cuna:         'Sala cuna / lactancia',
  fuero_maternal:    'Fuero maternal',
  otro:              'Otro',
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
