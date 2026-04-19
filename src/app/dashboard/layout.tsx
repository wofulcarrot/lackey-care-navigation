import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import 'leaflet/dist/leaflet.css'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Lackey Executive Dashboard',
  description: 'Digital Front Door — pilot metrics for Lackey Clinic leadership',
  robots: { index: false, follow: false },
}

// Dashboard uses the same design tokens + fonts as the patient front door
// so the staff side and the front door stay visually cohesive. The cream
// page background and Fraunces display serif carry through.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)] print:bg-white">
          <header className="border-b border-[var(--stroke)] bg-[var(--surface-0)] print:border-b-2">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center font-bold text-[17px] shadow-[var(--shadow-card)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                    aria-hidden="true"
                  >
                    L
                  </div>
                  <div>
                    <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl text-[var(--ink)]">
                      Lackey Digital Front Door
                    </h1>
                    <p className="text-sm text-[var(--ink-3)]">Executive pilot dashboard</p>
                  </div>
                </div>
                <div className="text-xs text-[var(--ink-3)] print:hidden">
                  Norfolk Healthcare Safety Net Collaborative
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-[var(--ink-3)] sm:px-6 lg:px-8">
            Confidential &middot; For internal Lackey leadership and pilot partners only
          </footer>
        </div>
      </body>
    </html>
  )
}
