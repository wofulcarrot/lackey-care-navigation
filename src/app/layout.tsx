import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Care Navigation App',
  description: 'Care navigation triage app for Lackey Clinic',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
