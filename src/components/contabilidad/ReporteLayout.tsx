'use client'

import { useRouter, usePathname } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Props {
  desde: string
  hasta: string
  children: React.ReactNode
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
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <span className="text-sm text-slate-500">Período:</span>
        <div className="flex items-center gap-2">
          <input type="date" value={desde} onChange={(e) => handleChange('desde', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <span className="text-slate-400">–</span>
          <input type="date" value={hasta} onChange={(e) => handleChange('hasta', e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <span className="text-sm text-slate-500">Al:</span>
        <input type="date" value={hasta}
          onChange={(e) => router.push(`${pathname}?hasta=${e.target.value}`)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
