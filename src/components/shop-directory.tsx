import Link from 'next/link'
import { resolveShopBannerUrl } from '@/lib/shops'
import type { ShopRow } from '@/types/shop'

export function ShopDirectory({ shops }: { shops: ShopRow[] }) {
  if (shops.length === 0) {
    return (
      <p className="text-center text-zinc-500">
        Todavía no hay tiendas publicadas. ¡Sé la primera en{' '}
        <Link href="/registro" className="text-brand-accent underline">
          crear la tuya
        </Link>
        !
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => {
        const bannerUrl = resolveShopBannerUrl(shop)
        return (
          <Link
            key={shop.id}
            href={`/tienda/${shop.slug}`}
            className="group relative flex min-h-[7.75rem] flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-700/80 p-4 text-center shadow-lg transition hover:border-brand"
          >
            {bannerUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/45" />
              </>
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(160deg, ${shop.theme.primary} 0%, color-mix(in srgb, ${shop.theme.primary} 40%, #18181b) 100%)`,
                }}
              />
            )}
            <div className="relative z-10 flex w-full flex-col items-center justify-center gap-1 px-1">
              <h3 className="line-clamp-2 font-semibold text-white drop-shadow-md group-hover:text-brand">
                {shop.name}
              </h3>
              {shop.category_label && (
                <p className="text-xs font-medium text-zinc-200/90">{shop.category_label}</p>
              )}
              {shop.description && (
                <p className="line-clamp-2 max-w-[28ch] text-sm text-zinc-300/95">{shop.description}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

