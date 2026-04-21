import type { Metadata } from 'next'
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google'
import 'leaflet/dist/leaflet.css'
import '../globals.css'
import { Sidebar } from './components/Sidebar'
import { DashboardThemeScript } from './components/DashboardThemeScript'

export const metadata: Metadata = {
  title: 'Lackey Staff Console',
  description: 'Digital Front Door — pilot metrics for Lackey Clinic leadership',
  robots: { index: false, follow: false },
}

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
// JetBrains Mono is the numeric / mono font the design spec calls for
// on stat values + ⌘K hints. Loaded only on the dashboard to keep the
// patient-flow bundle lean.
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
})

/**
 * Staff-console shell — a full-height two-column layout with a dark
 * sage sidebar on the left and the main content on the right. The
 * sidebar hides below lg so the dashboard still works on tablets; on
 * phones the expectation is the staff views are desktop-only.
 *
 * No auth logic lives here — that's middleware-level Basic Auth. The
 * layout just cares about framing.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}
    >
      <head>
        {/* Sets `dashboard-scope` + theme class on <html> before paint so
            there's no flash of wrong palette on refresh. */}
        <DashboardThemeScript />
      </head>
      <body>
        <div className="min-h-[100dvh] bg-[var(--page-bg)] text-[var(--ink)] flex print:bg-white">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col">{children}</div>
        </div>
      </body>
    </html>
  )
}
