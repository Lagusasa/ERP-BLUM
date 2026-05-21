import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-700 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">ERP SaaS Chile</h1>
        <p className="text-slate-500 text-sm mt-1">Plataforma contable y tributaria enterprise</p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-xs text-slate-400">
        ¿Problemas para acceder?{' '}
        <a href="mailto:soporte@erpsaas.cl" className="text-emerald-700 hover:underline">
          Contactar soporte
        </a>
      </p>
    </div>
  )
}
