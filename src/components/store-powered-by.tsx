import Link from 'next/link'
import { PLAN_LIMITS } from '@/lib/plans'
import type { ShopRow } from '@/types/shop'

export function StorePoweredBy({ shop }: { shop: ShopRow }) {
  if (!PLAN_LIMITS[shop.plan].showPoweredBy) return null

  const href = shop.slug
    ? `/registro?ref=${encodeURIComponent(shop.slug)}`
    : '/registro'

  return (
    <div className="py-4 text-center">
      <p className="text-xs text-zinc-500">
        Tienda creada con{' '}
        <Link
          href={href}
          className="font-medium text-brand-accent underline-offset-2 hover:underline"
        >
          Mendoshop
        </Link>
        {' — '}
        <Link href={href} className="text-zinc-400 hover:text-zinc-200">
          Creá la tuya gratis
        </Link>
      </p>
    </div>
  )
}
