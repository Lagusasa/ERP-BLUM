import { createClient } from '@/lib/supabase/server'

export interface ResumenIVAPeriodo {
  mes: number
  anio: number
  debito_fiscal: number
  credito_fiscal: number
  iva_a_pagar: number
  remanente: number
  documentos_venta: number
  documentos_compra: number
}

export interface DocumentoLibroIVA {
  id: string
  fecha_emision: string
  tipo_doc: string
  numero_documento: string
  rut: string
  razon_social: string
  neto: number
  exento: number
  iva: number
  total: number
  estado: string
}

export async function getResumenIVA(
  empresa_id: string,
  mes: number,
  anio: number
): Promise<ResumenIVAPeriodo> {
  const supabase = await createClient()

  const [ventas, compras] = await Promise.allSettled([
    supabase
      .from('documentos_venta')
      .select('iva, neto')
      .eq('empresa_id', empresa_id)
      .eq('es_afecto', true)
      .neq('estado', 'anulado')
      .gte('fecha_emision', `${anio}-${String(mes).padStart(2, '0')}-01`)
      .lte('fecha_emision', `${anio}-${String(mes).padStart(2, '0')}-31`),
    supabase
      .from('documentos_compra')
      .select('iva, neto')
      .eq('empresa_id', empresa_id)
      .eq('es_afecto', true)
      .neq('estado', 'anulado')
      .gte('fecha_emision', `${anio}-${String(mes).padStart(2, '0')}-01`)
      .lte('fecha_emision', `${anio}-${String(mes).padStart(2, '0')}-31`),
  ])

  const docsVenta = ventas.status === 'fulfilled' ? (ventas.value.data ?? []) : []
  const docsCompra = compras.status === 'fulfilled' ? (compras.value.data ?? []) : []

  const debito = docsVenta.reduce((s, d) => s + (d.iva ?? 0), 0)
  const credito = docsCompra.reduce((s, d) => s + (d.iva ?? 0), 0)
  const iva_a_pagar = Math.max(0, debito - credito)
  const remanente = Math.max(0, credito - debito)

  return {
    mes,
    anio,
    debito_fiscal: debito,
    credito_fiscal: credito,
    iva_a_pagar,
    remanente,
    documentos_venta: docsVenta.length,
    documentos_compra: docsCompra.length,
  }
}

export async function getLibroIVAVentas(
  empresa_id: string,
  mes: number,
  anio: number
): Promise<DocumentoLibroIVA[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documentos_venta')
    .select(`
      id, fecha_emision, numero_documento, neto, exento, iva, total, estado,
      tipo_documento:tipos_documento(codigo, nombre, abreviatura),
      cliente:clientes(rut, razon_social)
    `)
    .eq('empresa_id', empresa_id)
    .gte('fecha_emision', `${anio}-${String(mes).padStart(2, '0')}-01`)
    .lte('fecha_emision', `${anio}-${String(mes).padStart(2, '0')}-31`)
    .order('fecha_emision', { ascending: true })
    .order('numero_documento', { ascending: true })

  if (error || !data) return []

  return data.map((d) => ({
    id: d.id,
    fecha_emision: d.fecha_emision,
    tipo_doc: (d.tipo_documento as { abreviatura?: string })?.abreviatura ?? '—',
    numero_documento: d.numero_documento,
    rut: (d.cliente as { rut?: string })?.rut ?? '—',
    razon_social: (d.cliente as { razon_social?: string })?.razon_social ?? '—',
    neto: d.neto,
    exento: d.exento,
    iva: d.iva,
    total: d.total,
    estado: d.estado,
  }))
}

export async function getLibroIVACompras(
  empresa_id: string,
  mes: number,
  anio: number
): Promise<DocumentoLibroIVA[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documentos_compra')
    .select(`
      id, fecha_emision, numero_documento, neto, exento, iva, total, estado,
      tipo_documento:tipos_documento(codigo, nombre, abreviatura),
      proveedor:proveedores(rut, razon_social)
    `)
    .eq('empresa_id', empresa_id)
    .gte('fecha_emision', `${anio}-${String(mes).padStart(2, '0')}-01`)
    .lte('fecha_emision', `${anio}-${String(mes).padStart(2, '0')}-31`)
    .order('fecha_emision', { ascending: true })
    .order('numero_documento', { ascending: true })

  if (error || !data) return []

  return data.map((d) => ({
    id: d.id,
    fecha_emision: d.fecha_emision,
    tipo_doc: (d.tipo_documento as { abreviatura?: string })?.abreviatura ?? '—',
    numero_documento: d.numero_documento,
    rut: (d.proveedor as { rut?: string })?.rut ?? '—',
    razon_social: (d.proveedor as { razon_social?: string })?.razon_social ?? '—',
    neto: d.neto,
    exento: d.exento,
    iva: d.iva,
    total: d.total,
    estado: d.estado,
  }))
}

export async function getDeclaracionesF29(empresa_id: string): Promise<{
  id: string
  periodo_mes: number
  periodo_anio: number
  estado: string
  total_debito_fiscal: number
  total_credito_fiscal: number
  iva_a_pagar: number
  remanente_credito: number
  ppm_monto: number
  total_a_pagar: number
  fecha_presentacion: string | null
}[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('declaraciones_f29')
    .select('id, periodo_mes, periodo_anio, estado, total_debito_fiscal, total_credito_fiscal, iva_a_pagar, remanente_credito, ppm_monto, total_a_pagar, fecha_presentacion')
    .eq('empresa_id', empresa_id)
    .order('periodo_anio', { ascending: false })
    .order('periodo_mes', { ascending: false })

  if (error || !data) return []
  return data
}
