import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Care Navigation App',
  description: 'Care navigation triage app for Lackey Clinic',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
