import { useTranslations } from 'next-intl'

interface ErrorFallbackProps {
  clinicPhone?: string
  virtualCareUrl?: string
}

export function ErrorFallback({ clinicPhone, virtualCareUrl }: ErrorFallbackProps) {
  const t = useTranslations('results')
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h2 className="text-2xl font-bold mb-4">We're having trouble loading this page</h2>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {clinicPhone && (
          <a href={`tel:${clinicPhone}`} className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]">
            {t('call')} Lackey Clinic
          </a>
        )}
        {virtualCareUrl && (
          <a href={virtualCareUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-green-600 text-white text-center py-4 rounded-xl text-lg font-bold min-h-[48px]">
            Start Free Virtual Visit
          </a>
        )}
      </div>
    </div>
  )
}
