import type { Metadata } from 'next'
import 'leaflet/dist/leaflet.css'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Lackey Executive Dashboard',
  description: 'Digital Front Door — pilot metrics for Lackey Clinic leadership',
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 text-gray-900 print:bg-white">
          <header className="border-b border-gray-200 bg-white print:border-b-2">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Lackey Digital Front Door
                  </h1>
                  <p className="text-sm text-gray-600">Executive pilot dashboard</p>
                </div>
                <div className="text-xs text-gray-500 print:hidden">
                  Norfolk Healthcare Safety Net Collaborative
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-gray-500 sm:px-6 lg:px-8">
            Confidential &middot; For internal Lackey leadership and pilot partners only
          </footer>
        </div>
      </body>
    </html>
  )
}
