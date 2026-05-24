'use client'

import { useRouter, usePathname } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Props {
  desde: string
  hasta: string
  children: React.ReactNode
}

function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors print:hidden"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
      </svg>
      Imprimir / PDF
    </button>
  )
}

export function ReportePeriodo({ desde, hasta, children }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(field: 'desde' | 'hasta', value: string) {
    const params = new URLSearchParams({ desde, hasta, [field]: value })
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 flex-wrap print:hidden">
        <span className="text-sm text-slate-500">Período:</span>
        <div className="flex items-center gap-2">
          <input type="date" value={desde} onChange={(e) => handleChange('desde', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <span className="text-slate-400">–</span>
          <input type="date" value={hasta} onChange={(e) => handleChange('hasta', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>
      {children}
    </div>
  )
}

export function ReporteFecha({ hasta, children }: { hasta: string; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 flex-wrap print:hidden">
        <span className="text-sm text-slate-500">Al:</span>
        <input type="date" value={hasta}
          onChange={(e) => router.push(`${pathname}?hasta=${e.target.value}`)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>
      {children}
    </div>
  )
}

export function MontoCell({ monto, className }: { monto: number; className?: string }) {
  return (
    <td className={`px-4 py-2 text-right tabular-nums text-sm ${className ?? ''}`}>
      {monto !== 0 ? formatCurrency(monto) : '—'}
    </td>
  )
}
