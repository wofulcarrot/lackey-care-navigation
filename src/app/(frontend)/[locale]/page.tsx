import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('landing')

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <h1 className="text-3xl font-bold mb-4 leading-tight">{t('hero')}</h1>
      <p className="text-gray-600 mb-8 text-lg">{t('subtitle')}</p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href={`/${locale}/emergency`}
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl text-xl font-bold min-h-[48px]"
        >
          {t('getCareNow')}
        </Link>

        <Link
          href={`/${locale}/virtual-care`}
          className="block w-full bg-green-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]"
        >
          {t('virtualCare')}
        </Link>
      </div>
    </div>
  )
}
