import Link from 'next/link'
import { planExpiryNotice } from '@/lib/plan-expiry'
import type { ShopRow } from '@/types/shop'

export function PlanExpiryBanner({ shop }: { shop: ShopRow }) {
  const notice = planExpiryNotice(shop.plan_until)
  if (!notice) return null

  const styles = notice.expired
    ? 'border-red-800/60 bg-red-950/40 text-red-100'
    : notice.urgent
      ? 'border-amber-700/60 bg-amber-950/40 text-amber-100'
      : 'border-amber-800/50 bg-amber-950/30 text-amber-100'

  const message = notice.expired
    ? 'Tu plan venció. La tienda puede dejar de mostrarse al público.'
    : notice.urgent
      ? `Tu plan vence ${notice.daysLeft === 0 ? 'hoy' : 'mañana'}. Renová para no perder visibilidad.`
      : `Tu plan vence en ${notice.daysLeft} día${notice.daysLeft === 1 ? '' : 's'}.`

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role="status">
      <p>{message}</p>
      <p className="mt-2">
        <Link href="/dashboard/account" className="font-semibold underline hover:opacity-90">
          Renovar en Cuenta
        </Link>
        {' · '}
        <Link href="/precios" className="underline hover:opacity-90">
          Ver planes
        </Link>
      </p>
    </div>
  )
}
