'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database.types'
import type { EmpresaBasica } from '@/types/auth.types'
import EmpresaSwitcher from './EmpresaSwitcher'

interface HeaderProps {
  user: Tables<'perfiles'> | null
  email: string
  empresas: EmpresaBasica[]
  empresaActiva: EmpresaBasica | null
}

export default function Header({ user, email, empresas, empresaActiva }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = user ? `${user.nombre} ${user.apellido}` : email
  const initials = user
    ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
    : email[0].toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
      <EmpresaSwitcher empresas={empresas} empresaActiva={empresaActiva} />

      <div className="flex items-center gap-3">
        <button className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{displayName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
            title="Cerrar sesión"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
