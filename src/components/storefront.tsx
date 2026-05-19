'use client'

import { useMemo, useState } from 'react'
import { useCart } from '@/context/cart-context'
import { formatMoneyArs } from '@/lib/format'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { shopBackgroundClass, themeCssVars } from '@/lib/themes'
import { PLAN_LIMITS } from '@/lib/plans'
import type { CategoryRow } from '@/types/catalog'
import type { ShopRow } from '@/types/shop'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { StoreCartDrawer } from '@/components/store-cart-drawer'
import Link from 'next/link'

type Props = {
  shop: ShopRow
  categories: CategoryRow[]
}

export function Storefront({ shop, categories }: Props) {
  const { addLine, lines } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const cartCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines])
  const showPoweredBy = PLAN_LIMITS[shop.plan].showPoweredBy

  return (
    <div
      className={`min-h-screen ${shopBackgroundClass(shop.theme)}`}
      style={themeCssVars(shop.theme)}
    >
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{shop.name}</h1>
            {shop.description && (
              <p className="truncate text-xs text-zinc-400">{shop.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="btn-primary relative shrink-0 text-sm"
          >
            Carrito
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-zinc-900">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        {categories.length === 0 && (
          <p className="text-center text-zinc-500 py-12">Esta tienda aún no tiene productos.</p>
        )}
        {categories.map((cat) => (
          <section key={cat.id} className="scroll-mt-24">
            <h2
              className="mb-4 text-xl font-bold border-l-4 pl-3"
              style={{ borderColor: 'var(--shop-primary)' }}
            >
              {cat.name}
            </h2>
            {cat.subcategories.map((sub) => (
              <div key={sub.id} className="mb-8">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  {sub.name}
                </h3>
                <ProductGrid
                  products={sub.products}
                  categoryId={cat.id}
                  categoryName={cat.name}
                  categorySort={cat.sort_order}
                  onAdd={addLine}
                />
                {sub.subsubcategorias.map((ss) => (
                  <div key={ss.id} className="mb-6 ml-2 border-l border-zinc-800 pl-4">
                    <h4 className="mb-2 text-sm text-zinc-300">{ss.name}</h4>
                    <ProductGrid
                      products={ss.products}
                      categoryId={cat.id}
                      categoryName={cat.name}
                      categorySort={cat.sort_order}
                      onAdd={addLine}
                    />
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}
      </main>

      {showPoweredBy && (
        <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
          <p className="mb-2">Vitrina creada con</p>
          <MendoshopLogoLink size={40} className="mx-auto" />
        </footer>
      )}

      <StoreCartDrawer shop={shop} open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

function ProductGrid({
  products,
  categoryId,
  categoryName,
  categorySort,
  onAdd,
}: {
  products: CategoryRow['subcategories'][0]['products']
  categoryId: string
  categoryName: string
  categorySort: number
  onAdd: ReturnType<typeof useCart>['addLine']
}) {
  if (products.length === 0) return null
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const img = getPublicUrlFromPath(p.image_path)
        const outOfStock = p.stock_quantity <= 0
        return (
          <li key={p.id} className="card flex flex-col">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={p.name} className="mb-3 aspect-square w-full rounded-xl object-cover" />
            ) : (
              <div className="mb-3 aspect-square w-full rounded-xl bg-zinc-800" />
            )}
            <h4 className="font-medium">{p.name}</h4>
            {p.description && <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{p.description}</p>}
            <p className="mt-2 font-semibold" style={{ color: 'var(--shop-accent)' }}>
              {formatMoneyArs(Number(p.price))}
            </p>
            <button
              type="button"
              disabled={outOfStock}
              className="btn-primary mt-auto pt-3 text-sm disabled:opacity-40"
              onClick={() =>
                onAdd({
                  productId: p.id,
                  name: p.name,
                  unitPrice: Number(p.price),
                  maxStock: p.stock_quantity,
                  imagePath: p.image_path,
                  categoryId,
                  categoryName,
                  categorySortOrder: categorySort,
                })
              }
            >
              {outOfStock ? 'Sin stock' : 'Agregar'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

