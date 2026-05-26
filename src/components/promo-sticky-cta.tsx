'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { buildRegistroUrlFromMarketing } from '@/lib/marketing'

export function PromoStickyCta() {
  const params = useSearchParams()
  const registroUrl = buildRegistroUrlFromMarketing({
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  })

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/80 bg-zinc-950/95 p-3 backdrop-blur-md sm:hidden">
      <Link href={registroUrl} className="btn-primary block w-full py-3 text-center text-base">
        Empezar 7 días gratis
      </Link>
    </div>
  )
}
