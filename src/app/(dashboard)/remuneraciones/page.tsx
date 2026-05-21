import type { Metadata } from 'next'
import { getEmpresaActiva } from '@/lib/empresa'
import { getTrabajadores, getResumenRemuneraciones } from '@/services/remuneraciones.service'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Remuneraciones — Resumen' }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default async function RemuneracionesPage() {
  const empresa = await getEmpresaActiva()
  if (!empresa) return null

  const now = new Date()
  const mes = now.getMonth() + 1
  const anio = now.getFullYear()

  const [trabajadores, resumen] = await Promise.allSettled([
    getTrabajadores(empresa.id),
    getResumenRemuneraciones(empresa.id, mes, anio),
  ])

  const listaT = trabajadores.status === 'fulfilled' ? trabajadores.value : []
  const resumenData = resumen.status === 'fulfilled'
    ? resumen.value
    : { total_trabajadores: 0, total_bruto: 0, total_descuentos: 0, total_liquido: 0, liquidaciones_aprobadas: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Período: <span className="font-medium">{MESES[mes - 1]} {anio}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trabajadores Activos</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{listaT.length}</p>
          <p className="text-xs text-slate-400 mt-1">Con contrato vigente</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Bruto Mes</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{formatCurrency(resumenData.total_bruto)}</p>
          <p className="text-xs text-slate-400 mt-1">Imponible + no imponible</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Descuentos</p>
          <p className="text-2xl font-bold text-red-600 mt-2 tabular-nums">{formatCurrency(resumenData.total_descuentos)}</p>
          <p className="text-xs text-slate-400 mt-1">AFP, salud, seg. ces., imp.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Líquido</p>
          <p className="text-2xl font-bold text-green-600 mt-2 tabular-nums">{formatCurrency(resumenData.total_liquido)}</p>
          <p className="text-xs text-slate-400 mt-1">A pagar a trabajadores</p>
        </div>
      </div>

      {listaT.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
          <p className="text-sm font-medium text-slate-600 mb-1">No hay trabajadores registrados</p>
          <p className="text-xs text-slate-400 mb-4">Comienza registrando los trabajadores de la empresa</p>
          <a href="/remuneraciones/trabajadores/nuevo"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors">
            Registrar primer trabajador
          </a>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Trabajadores con contrato activo</h3>
            <a href="/remuneraciones/trabajadores" className="text-xs text-emerald-700 hover:underline">Ver todos →</a>
          </div>
          <div className="space-y-2">
            {listaT.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.nombre} {t.apellido_paterno}</p>
                  <p className="text-xs text-slate-400">{t.contrato_activo?.cargo ?? '—'}</p>
                </div>
                <p className="text-sm font-medium tabular-nums text-slate-700">
                  {t.contrato_activo ? formatCurrency(t.contrato_activo.sueldo_base) : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
