'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { imageFocusStyle } from '@/lib/image-focus'
import { useCart } from '@/context/cart-context'
import { getShopBannerDisplayUrl } from '@/lib/shop-banner'
import { templateBannerSrc } from '@/lib/store-templates'
import { CategoryIcon } from '@/lib/category-icons'
import { resolveProductFrameColor, shopBackgroundClass, themeCssVars } from '@/lib/themes'
import type { CategoryRow } from '@/types/catalog'
import {
  flattenProducts,
  productsForCategory,
  type FlatProduct,
} from '@/lib/flat-product'
import type { ShopRow } from '@/types/shop'
import { StoreSocialFooter } from '@/components/store-social-footer'
import { StoreHeaderBrand } from '@/components/store-header-brand'
import { StoreCartDrawer } from '@/components/store-cart-drawer'
import { StoreCategoryDrawer } from '@/components/store-category-drawer'
import {
  StoreProductViewSelector,
  type ProductViewMode,
} from '@/components/store-product-view-selector'
import { StoreWhatsAppBar } from '@/components/store-whatsapp-bar'
import { StorePoweredBy } from '@/components/store-powered-by'
import { ProductDetailModal } from '@/components/product-detail-modal'
import {
  maxFeaturedProductsForPlan,
  planHasFeaturedCarousel,
  resolveFeaturedProducts,
} from '@/lib/featured-products'
import { FeaturedProductsCarousel } from '@/components/featured-products-carousel'
import { StoreProductCard } from '@/components/store-product-card'

type Props = {
  shop: ShopRow
  categories: CategoryRow[]
  mode?: 'public' | 'edit'
  onOpenBannerEditor?: () => void
  onOpenAppearanceEditor?: () => void
  onOpenFeaturedEditor?: () => void
}

const PRICE_PAGE_SIZE = 8

function resolveBannerUrl(shop: ShopRow): string | null {
  const custom = getShopBannerDisplayUrl(shop.banner_path)
  if (custom) return custom
  return templateBannerSrc(shop.theme.templateId)
}

export function Storefront({
  shop,
  categories,
  mode = 'public',
  onOpenBannerEditor,
  onOpenAppearanceEditor,
  onOpenFeaturedEditor,
}: Props) {
  const isEdit = mode === 'edit'
  const { addLine, lines } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set())
  const [productViewMode, setProductViewMode] = useState<ProductViewMode>('category')
  const [priceVisibleCount, setPriceVisibleCount] = useState(PRICE_PAGE_SIZE)
  const [detailProduct, setDetailProduct] = useState<FlatProduct | null>(null)

  useEffect(() => {
    if (!isEdit) return
    setExpandedCategories(new Set(categories.map((c) => c.id)))
  }, [isEdit, categories])

  useEffect(() => {
    if (productViewMode === 'category') return
    setPriceVisibleCount(PRICE_PAGE_SIZE)
  }, [productViewMode])
  const cartCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines])
  const isLight = shop.theme.background === 'light'
  const themeStyle = themeCssVars(shop.theme)
  const productFrame = resolveProductFrameColor(shop.theme)
  const products = useMemo(() => flattenProducts(categories), [categories])
  const featuredMax = maxFeaturedProductsForPlan(shop.plan)
  const featuredProducts = useMemo(
    () =>
      resolveFeaturedProducts(products, shop.featured_product_ids, {
        publicOnly: !isEdit,
        max: featuredMax,
      }),
    [products, shop.featured_product_ids, isEdit, featuredMax],
  )
  const showFeaturedCarousel = planHasFeaturedCarousel(shop.plan) && featuredProducts.length > 0
  const bannerUrl = resolveBannerUrl(shop)
  const isBrandLogoBanner = !shop.banner_path && shop.theme.templateId === 'minimal'
  const bannerFocusStyle = imageFocusStyle({
    x: shop.banner_focus_x,
    y: shop.banner_focus_y,
  })

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
        maxStock: 999,
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

  const productsByPrice = useMemo(() => {
    if (productViewMode === 'price_asc') {
      return [...products].sort((a, b) => Number(a.price) - Number(b.price))
    }
    if (productViewMode === 'price_desc') {
      return [...products].sort((a, b) => Number(b.price) - Number(a.price))
    }
    return products
  }, [products, productViewMode])

  const visiblePriceProducts = useMemo(
    () => productsByPrice.slice(0, priceVisibleCount),
    [productsByPrice, priceVisibleCount],
  )

  const priceRemaining = productsByPrice.length - visiblePriceProducts.length

  return (
    <div
      className={`min-h-screen pb-24 ${shopBackgroundClass(shop.theme)}${isEdit ? ' store-editor-preview' : ''}`}
      style={themeStyle}
    >
      <header className={isLight ? 'store-header-bar' : 'sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur'}>
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 md:max-w-5xl">
          <button
            type="button"
            className="store-header-menu-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
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

      <main className="mx-auto max-w-lg px-4 md:max-w-5xl">
        {bannerUrl ? (
          <div
            className={
              isLight
                ? 'store-banner-shell store-banner-frame mt-3'
                : 'store-banner-shell mt-3 overflow-hidden rounded-2xl border border-zinc-800'
            }
          >
            <div className="store-banner-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerUrl}
                alt=""
                decoding="async"
                fetchPriority="high"
                className={`absolute inset-0 h-full w-full ${
                  isBrandLogoBanner ? 'object-contain bg-zinc-950 p-6' : 'object-cover'
                }`}
                style={isBrandLogoBanner ? undefined : bannerFocusStyle}
              />
              {isEdit && onOpenBannerEditor && (
                <button
                  type="button"
                  className="store-edit-overlay-btn"
                  onClick={onOpenBannerEditor}
                >
                  Editar banner
                </button>
              )}
              {shop.banner_show_shop_name ? (
                <div className="store-banner-badge-wrap">
                  <div className="store-banner-title-badge">
                    <h1 className="store-banner-shop-name">{shop.name}</h1>
                  </div>
                </div>
              ) : (
                <h1 className="sr-only">{shop.name}</h1>
              )}
            </div>
          </div>
        ) : null}
        {shop.description ? (
          <p
            className={`store-shop-tagline store-vitrina-title-text text-center ${bannerUrl ? 'mt-2' : 'mb-3 pt-2'}`}
          >
            {shop.description}
          </p>
        ) : null}
        {!bannerUrl ? (
          <div className="pt-2 text-center">
            <h1 className={`text-2xl font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              {shop.name}
            </h1>
          </div>
        ) : null}

        {isEdit && onOpenAppearanceEditor && (
          <div className="mt-2 flex justify-center">
            <button type="button" className="store-edit-chip" onClick={onOpenAppearanceEditor}>
              Editar colores y apariencia
            </button>
          </div>
        )}

        <section id="productos" className="scroll-mt-20 py-4">
          {(featuredProducts.length > 0 || (isEdit && onOpenFeaturedEditor)) && (
            <div className="mb-4 text-center">
              <h2 className="store-section-title store-vitrina-title-text text-lg font-bold">
                Productos destacados
              </h2>
              {isEdit && onOpenFeaturedEditor && (
                <button
                  type="button"
                  className="store-edit-chip mt-2"
                  onClick={onOpenFeaturedEditor}
                >
                  Elegir destacados ({featuredProducts.length}/{featuredMax})
                </button>
              )}
            </div>
          )}

          {products.length === 0 && (
            <p className={`py-12 text-center ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Esta tienda aún no tiene productos.
            </p>
          )}

          {featuredProducts.length > 0 &&
            (showFeaturedCarousel ? (
              <FeaturedProductsCarousel
                products={featuredProducts}
                isLight={isLight}
                accentFrame={productFrame}
                isEdit={isEdit}
                onAdd={addProduct}
                onOpenDetail={setDetailProduct}
              />
            ) : (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {featuredProducts.map((p) => (
                  <StoreProductCard
                    key={p.id}
                    product={p}
                    isLight={isLight}
                    accentFrame={productFrame}
                    isEdit={isEdit}
                    onAdd={() => addProduct(p)}
                    onOpenDetail={() => setDetailProduct(p)}
                  />
                ))}
              </ul>
            ))}
        </section>

        {products.length > 0 && (
          <section className="scroll-mt-20 pb-6">
            <StoreProductViewSelector
              value={productViewMode}
              onChange={setProductViewMode}
              categoryIcon={shop.category_view_icon}
            />

            {productViewMode === 'category' && categoriesWithProducts.length > 0 && (
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
                      className="store-category-toggle flex w-full items-center justify-between gap-2 border px-4 py-3 text-left text-sm font-semibold"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <CategoryIcon icon={cat.icon} themeColor="title" className="h-5 w-5 shrink-0" />
                        <span className="store-vitrina-title-text truncate">
                          {cat.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-normal opacity-70">
                        <ChevronIcon open={expanded} />
                      </span>
                    </button>
                    {expanded && (
                      <ul className="grid grid-cols-2 gap-3 border-t border-zinc-200/80 p-3 dark:border-zinc-700/80 md:grid-cols-3">
                        {catProducts.map((p) => (
                          <StoreProductCard
                            key={p.id}
                            product={p}
                            isLight={isLight}
                            accentFrame={productFrame}
                            isEdit={isEdit}
                            onAdd={() => addProduct(p)}
                            onOpenDetail={() => setDetailProduct(p)}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
            )}

            {productViewMode !== 'category' && (
              <div className="space-y-3">
                {productsByPrice.length === 0 ? (
                  <p className="text-center text-sm text-zinc-500">No hay productos para mostrar.</p>
                ) : (
                  <>
                    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {visiblePriceProducts.map((p) => (
                        <StoreProductCard
                          key={p.id}
                          product={p}
                          isLight={isLight}
                          accentFrame={productFrame}
                          isEdit={isEdit}
                          onAdd={() => addProduct(p)}
                          onOpenDetail={() => setDetailProduct(p)}
                        />
                      ))}
                    </ul>
                    {priceRemaining > 0 && (
                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          className="store-vitrina-title-text store-load-more-btn rounded-xl border px-5 py-2.5 text-sm font-semibold transition"
                          onClick={() =>
                            setPriceVisibleCount((n) =>
                              Math.min(n + PRICE_PAGE_SIZE, productsByPrice.length),
                            )
                          }
                        >
                          Ver más ({priceRemaining} restantes)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {productViewMode === 'category' && categoriesWithProducts.length === 0 && (
              <p className="text-center text-sm text-zinc-500">No hay productos en categorías.</p>
            )}
          </section>
        )}

      </main>

      <StorePoweredBy shop={shop} />
      <StoreSocialFooter shop={shop} isLight={isLight} />

      <StoreWhatsAppBar shop={shop} />
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          shopId={shop.id}
          isLight={isLight}
          accentFrame={productFrame}
          open={Boolean(detailProduct)}
          onClose={() => setDetailProduct(null)}
          onAdd={() => {
            addProduct(detailProduct)
            setDetailProduct(null)
          }}
        />
      )}
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
