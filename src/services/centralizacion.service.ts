import { createClient } from '@/lib/supabase/server'
import type { ConfigContable } from '@/types/reportes.types'

// ============================================================
// CONFIG CONTABLE
// ============================================================

export async function getConfigContable(empresa_id: string): Promise<ConfigContable | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('config_contable')
    .select('*')
    .eq('empresa_id', empresa_id)
    .maybeSingle()
  return data as ConfigContable | null
}

export async function saveConfigContable(empresa_id: string, config: Omit<ConfigContable, 'empresa_id'>): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('config_contable')
    .upsert({
      empresa_id,
      ...config,
      updated_by: user?.id ?? null,
    }, { onConflict: 'empresa_id' })

  return !error
}

// ============================================================
// CENTRALIZACIÓN AUTOMÁTICA
// ============================================================

export async function contabilizarDocumentoCompra(
  empresa_id: string,
  doc_id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documentos_compra')
    .select(`
      *,
      proveedor:proveedores(razon_social),
      tipo_documento:tipos_documento(nombre)
    `)
    .eq('id', doc_id)
    .eq('empresa_id', empresa_id)
    .maybeSingle()

  if (!doc) return { ok: false, error: 'Documento no encontrado' }
  if (doc.estado === 'contabilizado') return { ok: false, error: 'El documento ya está contabilizado' }
  if (doc.estado === 'anulado') return { ok: false, error: 'No se puede contabilizar un documento anulado' }

  const config = await getConfigContable(empresa_id)
  if (!config?.cuenta_gasto_id || !config?.cuenta_cxp_id) {
    return { ok: false, error: 'Configure las cuentas contables en Contabilidad → Configuración antes de centralizar' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const fechaDoc = doc.fecha_emision
  const anio = new Date(fechaDoc).getFullYear()
  const mes = new Date(fechaDoc).getMonth() + 1

  const { data: numero } = await supabase.rpc('siguiente_numero_comprobante', {
    p_empresa_id: empresa_id, p_anio: anio,
  })
  if (!numero) return { ok: false, error: 'No se pudo obtener número de comprobante' }

  const { data: periodo } = await supabase
    .from('periodos_contables')
    .select('id')
    .eq('empresa_id', empresa_id)
    .eq('anio', anio)
    .eq('mes', mes)
    .maybeSingle()

  const proveedor = (doc.proveedor as { razon_social?: string } | null)?.razon_social ?? 'Proveedor'
  const glosa = `Compra ${proveedor} N°${doc.numero_documento}`
  const totalLineas = doc.total

  const { data: comprobante, error: compErr } = await supabase
    .from('comprobantes')
    .insert({
      empresa_id,
      periodo_id: periodo?.id ?? null,
      numero,
      tipo: 'compras',
      fecha: fechaDoc,
      glosa,
      total_debe: totalLineas,
      total_haber: totalLineas,
      estado: 'aprobado',
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (compErr || !comprobante) return { ok: false, error: compErr?.message ?? 'Error al crear comprobante' }

  const lineas: {
    comprobante_id: string
    empresa_id: string
    cuenta_id: string
    debe: number
    haber: number
    glosa: string
    orden: number
  }[] = []

  let orden = 0

  // Debe: Gasto (neto + exento)
  const montoGasto = doc.neto + doc.exento
  if (montoGasto > 0) {
    lineas.push({ comprobante_id: comprobante.id, empresa_id, cuenta_id: config.cuenta_gasto_id, debe: montoGasto, haber: 0, glosa, orden: orden++ })
  }

  // Debe: IVA CF
  if (doc.iva > 0 && config.cuenta_iva_cf_id) {
    lineas.push({ comprobante_id: comprobante.id, empresa_id, cuenta_id: config.cuenta_iva_cf_id, debe: doc.iva, haber: 0, glosa: 'IVA Crédito Fiscal', orden: orden++ })
  }

  // Haber: CxP
  lineas.push({ comprobante_id: comprobante.id, empresa_id, cuenta_id: config.cuenta_cxp_id, debe: 0, haber: doc.total, glosa, orden: orden++ })

  const { error: linErr } = await supabase.from('comprobante_lineas').insert(lineas)
  if (linErr) return { ok: false, error: linErr.message }

  await supabase.from('documentos_compra').update({ estado: 'contabilizado' }).eq('id', doc_id)

  return { ok: true }
}

export async function contabilizarDocumentoVenta(
  empresa_id: string,
  doc_id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documentos_venta')
    .select(`
      *,
      cliente:clientes(razon_social),
      tipo_documento:tipos_documento(nombre)
    `)
    .eq('id', doc_id)
    .eq('empresa_id', empresa_id)
    .maybeSingle()

  if (!doc) return { ok: false, error: 'Documento no encontrado' }
  if (doc.estado === 'contabilizado') return { ok: false, error: 'El documento ya está contabilizado' }
  if (doc.estado === 'anulado') return { ok: false, error: 'No se puede contabilizar un documento anulado' }

  const config = await getConfigContable(empresa_id)
  if (!config?.cuenta_ingreso_id || !config?.cuenta_cxc_id) {
    return { ok: false, error: 'Configure las cuentas contables en Contabilidad → Configuración antes de centralizar' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const fechaDoc = doc.fecha_emision
  const anio = new Date(fechaDoc).getFullYear()
  const mes = new Date(fechaDoc).getMonth() + 1

  const { data: numero } = await supabase.rpc('siguiente_numero_comprobante', {
    p_empresa_id: empresa_id, p_anio: anio,
  })
  if (!numero) return { ok: false, error: 'No se pudo obtener número de comprobante' }

  const { data: periodo } = await supabase
    .from('periodos_contables')
    .select('id')
    .eq('empresa_id', empresa_id)
    .eq('anio', anio)
    .eq('mes', mes)
    .maybeSingle()

  const cliente = (doc.cliente as { razon_social?: string } | null)?.razon_social ?? 'Cliente'
  const glosa = `Venta ${cliente} N°${doc.numero_documento}`

  const { data: comprobante, error: compErr } = await supabase
    .from('comprobantes')
    .insert({
      empresa_id,
      periodo_id: periodo?.id ?? null,
      numero,
      tipo: 'ventas',
      fecha: fechaDoc,
      glosa,
      total_debe: doc.total,
      total_haber: doc.total,
      estado: 'aprobado',
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (compErr || !comprobante) return { ok: false, error: compErr?.message ?? 'Error al crear comprobante' }

  const lineas: {
    comprobante_id: string
    empresa_id: string
    cuenta_id: string
    debe: number
    haber: number
    glosa: string
    orden: number
  }[] = []

  let orden = 0

  // Debe: CxC
  lineas.push({ comprobante_id: comprobante.id, empresa_id, cuenta_id: config.cuenta_cxc_id, debe: doc.total, haber: 0, glosa, orden: orden++ })

  // Haber: Ingreso (neto + exento)
  const montoIngreso = doc.neto + doc.exento
  if (montoIngreso > 0) {
    lineas.push({ comprobante_id: comprobante.id, empresa_id, cuenta_id: config.cuenta_ingreso_id, debe: 0, haber: montoIngreso, glosa, orden: orden++ })
  }

  // Haber: IVA DF
  if (doc.iva > 0 && config.cuenta_iva_df_id) {
    lineas.push({ comprobante_id: comprobante.id, empresa_id, cuenta_id: config.cuenta_iva_df_id, debe: 0, haber: doc.iva, glosa: 'IVA Débito Fiscal', orden: orden++ })
  }

  const { error: linErr } = await supabase.from('comprobante_lineas').insert(lineas)
  if (linErr) return { ok: false, error: linErr.message }

  await supabase.from('documentos_venta').update({ estado: 'contabilizado' }).eq('id', doc_id)

  return { ok: true }
}
