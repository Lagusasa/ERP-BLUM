export type TipoDocumento = 'dte' | 'contrato' | 'liquidacion' | 'nomina' | 'certificado' | 'otro'

export const TIPO_DOC_LABELS: Record<TipoDocumento, string> = {
  dte:          'DTE / Factura',
  contrato:     'Contrato',
  liquidacion:  'Liquidación',
  nomina:       'Nómina',
  certificado:  'Certificado',
  otro:         'Otro',
}

export interface DocumentoGestion {
  id: string
  empresa_id: string
  tipo: TipoDocumento
  nombre: string
  descripcion: string | null
  url_externo: string | null
  storage_path: string | null
  mime_type: string | null
  tamano: number | null
  referencia_tabla: string | null
  referencia_id: string | null
  estado: 'activo' | 'archivado'
  created_at: string
  created_by: string | null
}
