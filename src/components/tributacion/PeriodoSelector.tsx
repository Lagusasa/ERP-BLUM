'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface Props {
  mes: number
  anio: number
  basePath: string
}

export default function PeriodoSelector({ mes, anio, basePath }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(newMes: number, newAnio: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('mes', String(newMes))
    params.set('anio', String(newAnio))
    router.push(`${basePath}?${params.toString()}`)
  }

  function prevMes() {
    if (mes === 1) navigate(12, anio - 1)
    else navigate(mes - 1, anio)
  }

  function nextMes() {
    const now = new Date()
    const currentMes = now.getMonth() + 1
    const currentAnio = now.getFullYear()
    if (anio > currentAnio || (anio === currentAnio && mes >= currentMes)) return
    if (mes === 12) navigate(1, anio + 1)
    else navigate(mes + 1, anio)
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={prevMes}
        className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-sm font-medium text-slate-700 min-w-[130px] text-center">
        {MESES[mes - 1]} {anio}
      </span>
      <button onClick={nextMes}
        className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
