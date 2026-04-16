import '../globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ThemeScript } from '@/components/ThemeScript'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as any)) notFound()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
