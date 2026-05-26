'use client'

import Link from 'next/link'
import { buildRegistroUrlFromMarketing } from '@/lib/marketing'

export function PromoCtaButtons({
  utmSource,
  utmMedium,
  utmCampaign,
}: {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}) {
  const registroUrl = buildRegistroUrlFromMarketing({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
  })

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href={registroUrl} className="btn-primary inline-block px-8 py-3 text-base">
        Empezar 7 días gratis
      </Link>
      <Link href="/precios" className="btn-secondary-outline inline-block px-6 py-3 text-base">
        Comparar planes
      </Link>
    </div>
  )
}
