'use client'

import Link from 'next/link'
import { buildRegistroUrlFromMarketing } from '@/lib/marketing'
import { buildWhatsAppUrl } from '@/lib/shops'
import { MENDOSHOP_SUPPORT_WHATSAPP } from '@/lib/platform-contact'

const PROMO_WA_MESSAGE =
  'Hola! Vi la promo de 7 días gratis en Mendoshop y quiero crear mi tienda online.'

export function PromoCtaButtons({
  utmSource,
  utmMedium,
  utmCampaign,
  size = 'default',
}: {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  size?: 'default' | 'large'
}) {
  const registroUrl = buildRegistroUrlFromMarketing({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
  })

  const waUrl = buildWhatsAppUrl(MENDOSHOP_SUPPORT_WHATSAPP, PROMO_WA_MESSAGE)
  const primaryClass = size === 'large' ? 'btn-primary px-10 py-3.5 text-base' : 'btn-primary px-8 py-3 text-base'
  const secondaryClass =
    size === 'large' ? 'btn-secondary-outline px-8 py-3.5 text-base' : 'btn-secondary-outline px-6 py-3 text-base'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={registroUrl} className={`${primaryClass} inline-block text-center`}>
        Empezar 7 días gratis
      </Link>
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className={`${secondaryClass} inline-block text-center`}>
        Consultar por WhatsApp
      </a>
    </div>
  )
}
