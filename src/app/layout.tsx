import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ERP SaaS Chile',
    template: '%s | ERP SaaS Chile',
  },
  description: 'Plataforma ERP SaaS enterprise para Chile — Contabilidad, Tributación, Remuneraciones y más',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
