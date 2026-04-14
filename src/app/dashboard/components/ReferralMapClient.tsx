'use client'

import dynamic from 'next/dynamic'

/**
 * Leaflet needs `window`, so the actual map is dynamically imported with SSR disabled.
 * This wrapper lets server components compose the map without crashing at build time.
 */
const ReferralMap = dynamic(
  () => import('./ReferralMap').then((m) => m.ReferralMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
        Loading map…
      </div>
    ),
  },
)

export default ReferralMap
