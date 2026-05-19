import Link from 'next/link'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import type { ShopRow } from '@/types/shop'

export function ShopDirectory({ shops }: { shops: ShopRow[] }) {
  if (shops.length === 0) {
    return (
      <p className="text-center text-zinc-500">
        Todavía no hay tiendas publicadas. ¡Sé la primera en{' '}
        <Link href="/registro" className="text-teal-400 underline">
          crear la tuya
        </Link>
        !
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => {
        const logo = getPublicUrlFromPath(shop.logo_path)
        return (
          <Link
            key={shop.id}
            href={`/tienda/${shop.slug}`}
            className="card group transition hover:border-teal-600/50"
          >
            <div className="flex items-start gap-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white"
                  style={{ backgroundColor: shop.theme.primary }}
                >
                  {shop.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold group-hover:text-teal-300">{shop.name}</h3>
                {shop.category_label && (
                  <p className="text-xs text-zinc-500">{shop.category_label}</p>
                )}
                {shop.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{shop.description}</p>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
