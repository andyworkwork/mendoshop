'use client'

import { useCallback, useMemo, useState } from 'react'
import { useCart } from '@/context/cart-context'
import { formatMoneyArs } from '@/lib/format'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { templateBannerSrc } from '@/lib/store-templates'
import { shopBackgroundClass, themeCssVars } from '@/lib/themes'
import { PLAN_LIMITS } from '@/lib/plans'
import type { CategoryRow, ProductRow } from '@/types/catalog'
import type { ShopRow } from '@/types/shop'
import { MendoshopLogoLink } from '@/components/mendoshop-logo'
import { StoreHeaderBrand } from '@/components/store-header-brand'
import { StoreCartDrawer } from '@/components/store-cart-drawer'
import { StoreCategoryDrawer } from '@/components/store-category-drawer'
import { StoreWhatsAppBar } from '@/components/store-whatsapp-bar'

const FEATURED_COUNT = 6

type Props = {
  shop: ShopRow
  categories: CategoryRow[]
}

type FlatProduct = ProductRow & {
  categoryId: string
  categoryName: string
  categorySort: number
}

function flattenProducts(categories: CategoryRow[]): FlatProduct[] {
  const out: FlatProduct[] = []
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      for (const p of sub.products) {
        out.push({
          ...p,
          categoryId: cat.id,
          categoryName: cat.name,
          categorySort: cat.sort_order,
        })
      }
      for (const ss of sub.subsubcategorias) {
        for (const p of ss.products) {
          out.push({
            ...p,
            categoryId: cat.id,
            categoryName: cat.name,
            categorySort: cat.sort_order,
          })
        }
      }
    }
  }
  return out
}

function productsForCategory(categories: CategoryRow[], categoryId: string): FlatProduct[] {
  return flattenProducts(categories).filter((p) => p.categoryId === categoryId)
}

function resolveBannerUrl(shop: ShopRow): string | null {
  const custom = getPublicUrlFromPath(shop.banner_path)
  if (custom) return custom
  return templateBannerSrc(shop.theme.templateId)
}

export function Storefront({ shop, categories }: Props) {
  const { addLine, lines } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set())
  const cartCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines])
  const showPoweredBy = PLAN_LIMITS[shop.plan].showPoweredBy
  const isLight = shop.theme.background === 'light'
  const themeStyle = themeCssVars(shop.theme)
  const products = useMemo(() => flattenProducts(categories), [categories])
  const featuredProducts = useMemo(() => products.slice(0, FEATURED_COUNT), [products])
  const bannerUrl = resolveBannerUrl(shop)

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }, [])

  const handleSelectCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => new Set(prev).add(categoryId))
    setMenuOpen(false)
    requestAnimationFrame(() => {
      document.getElementById(`categoria-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const addProduct = useCallback(
    (p: FlatProduct) => {
      addLine({
        productId: p.id,
        name: p.name,
        unitPrice: Number(p.price),
        maxStock: p.stock_quantity,
        imagePath: p.image_path,
        categoryId: p.categoryId,
        categoryName: p.categoryName,
        categorySortOrder: p.categorySort,
      })
    },
    [addLine],
  )

  const categoriesWithProducts = useMemo(
    () => categories.filter((cat) => productsForCategory(categories, cat.id).length > 0),
    [categories],
  )

  return (
    <div
      className={`min-h-screen pb-24 ${shopBackgroundClass(shop.theme)}`}
      style={themeStyle}
    >
      <header className={isLight ? 'store-header-bar' : 'sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur'}>
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 md:max-w-5xl">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 md:border-zinc-700 md:text-zinc-200"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
          <StoreHeaderBrand />
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="btn-primary relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg p-0 text-sm"
            aria-label="Carrito"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-zinc-900">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg md:max-w-5xl">
        {bannerUrl ? (
          <div className={isLight ? 'store-banner-frame' : 'mx-4 mt-3 overflow-hidden rounded-2xl border border-zinc-800'}>
            <div className="relative aspect-[3/2] w-full bg-zinc-200 sm:aspect-[21/10]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="store-banner-overlay">
                <div className="store-banner-title-badge">
                  <h1 className="store-banner-shop-name">{shop.name}</h1>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 pt-4 text-center">
            <h1 className={`text-2xl font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              {shop.name}
            </h1>
          </div>
        )}

        <section id="productos" className="scroll-mt-20 px-4 py-4">
          <div className="mb-4 text-center">
            {shop.description && (
              <p className={`store-shop-tagline ${!isLight ? '!text-zinc-400' : ''}`}>
                {shop.description}
              </p>
            )}
            <h2 className={`text-lg font-bold ${isLight ? 'text-zinc-900' : ''}`}>
              Productos destacados
            </h2>
          </div>

          {products.length === 0 && (
            <p className={`py-12 text-center ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Esta tienda aún no tiene productos.
            </p>
          )}

          {featuredProducts.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {featuredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isLight={isLight}
                  onAdd={() => addProduct(p)}
                />
              ))}
            </ul>
          )}
        </section>

        {categoriesWithProducts.length > 0 && (
          <section className="scroll-mt-20 px-4 pb-6">
            <h2 className={`mb-3 text-center text-lg font-bold ${isLight ? 'text-zinc-900' : ''}`}>
              Por categoría
            </h2>
            <div className="space-y-2">
              {categoriesWithProducts.map((cat) => {
                const catProducts = productsForCategory(categories, cat.id)
                const expanded = expandedCategories.has(cat.id)
                return (
                  <div
                    key={cat.id}
                    id={`categoria-${cat.id}`}
                    className="scroll-mt-24 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-700/80"
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => toggleCategory(cat.id)}
                      className={`store-category-toggle flex w-full items-center justify-between gap-2 border px-4 py-3 text-left text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}
                    >
                      <span>{cat.name}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-normal opacity-70">
                        {catProducts.length} producto{catProducts.length === 1 ? '' : 's'}
                        <ChevronIcon open={expanded} />
                      </span>
                    </button>
                    {expanded && (
                      <ul className="grid grid-cols-2 gap-3 border-t border-zinc-200/80 p-3 dark:border-zinc-700/80 md:grid-cols-3">
                        {catProducts.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            isLight={isLight}
                            onAdd={() => addProduct(p)}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </main>

      {showPoweredBy && (
        <footer
          className={`py-6 text-center text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-500'} ${isLight ? 'border-t border-zinc-200' : 'border-t border-zinc-800'}`}
        >
          <p className="mb-2">Vitrina creada con</p>
          <MendoshopLogoLink size={40} className="mx-auto" />
        </footer>
      )}

      <StoreWhatsAppBar shop={shop} />
      <StoreCategoryDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        themeStyle={themeStyle}
        onSelectCategory={handleSelectCategory}
      />
      <StoreCartDrawer shop={shop} open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}

function ProductCard({
  product: p,
  isLight,
  onAdd,
}: {
  product: FlatProduct
  isLight: boolean
  onAdd: () => void
}) {
  const img = getPublicUrlFromPath(p.image_path)
  const outOfStock = p.stock_quantity <= 0
  const cardClass = isLight ? 'store-card' : 'card flex flex-col'

  return (
    <li className={cardClass}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={p.name}
          className="mb-2 aspect-square w-full rounded-lg object-cover"
        />
      ) : (
        <div className={`mb-2 aspect-square w-full rounded-lg ${isLight ? 'bg-zinc-100' : 'bg-zinc-800'}`} />
      )}
      <h4 className={`text-sm font-medium leading-tight ${isLight ? 'text-zinc-900' : ''}`}>
        {p.name}
      </h4>
      <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--shop-accent)' }}>
        {formatMoneyArs(Number(p.price))}
      </p>
      <button
        type="button"
        disabled={outOfStock}
        className="btn-primary mt-2 w-full py-2 text-xs disabled:opacity-40"
        onClick={onAdd}
      >
        {outOfStock ? 'Sin stock' : 'Agregar'}
      </button>
    </li>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9m-6-9V6a2 2 0 012-2h0a2 2 0 012 2v7"
      />
    </svg>
  )
}
