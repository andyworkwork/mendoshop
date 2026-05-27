'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { revalidateStorefront, updateShopSettings } from '@/app/actions/shop'
import { ImageFocusControls } from '@/components/image-focus-controls'
import { ShopBannerUpload } from '@/components/shop-banner-upload'
import { Storefront } from '@/components/storefront'
import { CategoryIconPicker } from '@/components/category-icon-picker'
import { FeaturedProductsPicker } from '@/components/featured-products-picker'
import { ThemePicker } from '@/components/theme-picker'
import { categoryIconLabel } from '@/lib/category-icons'
import {
  flattenCatalogProducts,
  maxFeaturedProductsForPlan,
  sanitizeFeaturedProductIds,
} from '@/lib/featured-products'
import { normalizeImageFocus, type ImageFocus } from '@/lib/image-focus'
import { shopPublicUrl } from '@/lib/publicUrl'
import { markFirstStepsDone } from '@/lib/first-steps'
import { resolveShopBannerUrl } from '@/lib/shops'
import type { CategoryRow } from '@/types/catalog'
import type { ShopRow, ShopTheme } from '@/types/shop'

type Panel = null | 'appearance' | 'banner' | 'featured'

function EditorSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl"
        role="dialog"
        aria-labelledby="editor-sheet-title"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="editor-sheet-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-600 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function StoreEditor({
  shop: initialShop,
  categories: initialCategories,
}: {
  shop: ShopRow
  categories: CategoryRow[]
}) {
  const [shop, setShop] = useState(initialShop)
  const [categories, setCategories] = useState(initialCategories)
  const [panel, setPanel] = useState<Panel>(null)
  const [theme, setTheme] = useState<ShopTheme>(shop.theme)
  const [bannerFocus, setBannerFocus] = useState<ImageFocus>(() =>
    normalizeImageFocus(shop.banner_focus_x, shop.banner_focus_y),
  )
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [featuredIds, setFeaturedIds] = useState<string[]>(() =>
    sanitizeFeaturedProductIds(shop.featured_product_ids, flattenCatalogProducts(initialCategories), {
      max: maxFeaturedProductsForPlan(shop.plan),
    }),
  )
  const [categoryViewIcon, setCategoryViewIcon] = useState(shop.category_view_icon)
  const [bannerMediaKey, setBannerMediaKey] = useState(0)
  const [bannerShowShopName, setBannerShowShopName] = useState(
    () => shop.banner_show_shop_name !== false,
  )
  const searchParams = useSearchParams()
  const router = useRouter()
  const firstStepsVisit = searchParams.get('first') === '1'
  const openFromQuery = searchParams.get('open')

  const closePanel = useCallback(() => setPanel(null), [])

  useEffect(() => {
    if (openFromQuery === 'appearance') {
      setPanel('appearance')
      router.replace('/dashboard/editar-tienda', { scroll: false })
    }
  }, [openFromQuery, router])

  async function saveFeatured() {
    setBusy(true)
    setMsg(null)
    const ids = sanitizeFeaturedProductIds(featuredIds, flattenCatalogProducts(categories), {
      max: maxFeaturedProductsForPlan(shop.plan),
    })
    const res = await updateShopSettings(shop.id, { featured_product_ids: ids })
    setBusy(false)
    if ('error' in res && res.error) {
      setMsg(res.error)
      return
    }
    setFeaturedIds(ids)
    setShop((s) => ({ ...s, featured_product_ids: ids }))
    setMsg('Productos destacados guardados.')
    await revalidateStorefront(shop.slug)
    closePanel()
  }

  const handleThemeChange = useCallback(
    (next: ShopTheme) => {
      if (next.templateId !== theme.templateId) {
        setShop((s) => ({
          ...s,
          banner_path: null,
          banner_focus_x: 50,
          banner_focus_y: 50,
        }))
        setBannerFocus({ x: 50, y: 50 })
      }
      setTheme(next)
    },
    [theme.templateId],
  )

  async function saveAppearance() {
    setBusy(true)
    setMsg(null)
    const templateChanged = theme.templateId !== initialShop.theme.templateId
    const useTemplateBanner = templateChanged && !shop.banner_path
    const res = await updateShopSettings(shop.id, {
      theme,
      category_view_icon: categoryViewIcon,
      ...(useTemplateBanner
        ? { banner_path: null, banner_focus_x: 50, banner_focus_y: 50 }
        : {}),
    })
    setBusy(false)
    if ('error' in res && res.error) {
      setMsg(res.error)
      return
    }
    setShop((s) => ({
      ...s,
      theme,
      category_view_icon: categoryViewIcon,
      ...(useTemplateBanner
        ? { banner_path: null, banner_focus_x: 50, banner_focus_y: 50 }
        : {}),
    }))
    setMsg(
      useTemplateBanner
        ? 'Apariencia guardada. Banner actualizado al de la plantilla.'
        : 'Apariencia guardada.',
    )
    markFirstStepsDone(shop.id)
    await revalidateStorefront(shop.slug)
    closePanel()
  }

  async function saveBannerFrame() {
    const focus = normalizeImageFocus(bannerFocus.x, bannerFocus.y)
    setBusy(true)
    setMsg(null)
    const res = await updateShopSettings(shop.id, {
      banner_focus_x: focus.x,
      banner_focus_y: focus.y,
    })
    setBusy(false)
    if ('error' in res && res.error) {
      setMsg(res.error)
      return
    }
    setShop((s) => ({ ...s, banner_focus_x: focus.x, banner_focus_y: focus.y }))
    setMsg('Vista del banner guardada.')
    await revalidateStorefront(shop.slug)
    closePanel()
  }

  async function saveBannerShowShopName(show: boolean) {
    setBusy(true)
    setMsg(null)
    const res = await updateShopSettings(shop.id, { banner_show_shop_name: show })
    setBusy(false)
    if ('error' in res && res.error) {
      setMsg(res.error)
      setBannerShowShopName(shop.banner_show_shop_name !== false)
      return
    }
    setBannerShowShopName(show)
    setShop((s) => ({ ...s, banner_show_shop_name: show }))
    setMsg(show ? 'Nombre visible en el banner.' : 'Nombre oculto en el banner.')
    await revalidateStorefront(shop.slug)
  }

  const bannerPreviewShop = useMemo(
    () => ({
      ...shop,
      theme,
      category_view_icon: categoryViewIcon,
      banner_focus_x: bannerFocus.x,
      banner_focus_y: bannerFocus.y,
      banner_show_shop_name: bannerShowShopName,
    }),
    [shop, theme, categoryViewIcon, bannerFocus, bannerShowShopName],
  )

  const bannerFrameUrl = useMemo(() => resolveShopBannerUrl(bannerPreviewShop), [bannerPreviewShop])

  const isLogoBannerFrame = !shop.banner_path && theme.templateId === 'minimal'

  useEffect(() => {
    setBannerMediaKey((k) => k + 1)
  }, [shop.banner_path, theme.templateId])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3">
        <div>
          <p className="font-semibold text-white">Editar tienda</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="store-edit-chip"
            onClick={() => {
              setFeaturedIds(
                sanitizeFeaturedProductIds(shop.featured_product_ids, flattenCatalogProducts(categories), {
                  max: maxFeaturedProductsForPlan(shop.plan),
                }),
              )
              setPanel('featured')
            }}
          >
            Productos destacados
          </button>
          <button
            type="button"
            className="store-edit-chip"
            onClick={() => setPanel('appearance')}
          >
            Colores y apariencia
          </button>
          <a
            href={shopPublicUrl(shop.slug)}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-brand-accent hover:bg-zinc-800"
          >
            Ir a tienda ↗
          </a>
        </div>
      </div>

      {msg && (
        <p
          className={`text-sm ${msg.includes('Error') || msg.toLowerCase().includes('error') ? 'text-red-400' : 'text-brand'}`}
        >
          {msg}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-xl">
        <Storefront
          key={`preview-${shop.banner_path ?? 'template'}-${theme.templateId}-${bannerMediaKey}`}
          shop={bannerPreviewShop}
          categories={categories}
          mode="edit"
          onOpenBannerEditor={() => setPanel('banner')}
          onOpenAppearanceEditor={() => setPanel('appearance')}
          onOpenFeaturedEditor={() => {
            setFeaturedIds(
              sanitizeFeaturedProductIds(shop.featured_product_ids, flattenCatalogProducts(categories), {
                max: maxFeaturedProductsForPlan(shop.plan),
              }),
            )
            setPanel('featured')
          }}
        />
      </div>

      <p className="text-center text-xs text-zinc-500">
        Catálogo y datos en{' '}
        <Link href="/dashboard/catalog" className="text-brand-accent underline">
          Catálogo
        </Link>{' '}
        · SEO en{' '}
        <Link href="/dashboard/settings" className="text-brand-accent underline">
          Ajustes
        </Link>
      </p>

      {panel === 'featured' && (
        <EditorSheet title="Productos destacados" onClose={closePanel}>
          <FeaturedProductsPicker
            categories={categories}
            selectedIds={featuredIds}
            onChange={setFeaturedIds}
            disabled={busy}
            plan={shop.plan}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveFeatured()}
            className="btn-primary mt-4 w-full"
          >
            {busy ? 'Guardando…' : 'Guardar destacados'}
          </button>
        </EditorSheet>
      )}

      {panel === 'appearance' && (
        <EditorSheet title="Colores y apariencia" onClose={closePanel}>
          <ThemePicker
            value={theme}
            onChange={handleThemeChange}
            templatesDefaultOpen={firstStepsVisit}
          />
          <div className="mt-6 space-y-2 border-t border-zinc-800 pt-4">
            <p className="text-sm font-medium text-zinc-200">Icono del botón &quot;Categorías&quot;</p>
            <p className="text-xs text-zinc-500">
              Independiente del icono de cada categoría. Actual: {categoryIconLabel(categoryViewIcon)}
            </p>
            <CategoryIconPicker
              value={categoryViewIcon}
              disabled={busy}
              onChange={setCategoryViewIcon}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveAppearance()}
            className="btn-primary mt-4 w-full"
          >
            {busy ? 'Guardando…' : 'Guardar apariencia'}
          </button>
        </EditorSheet>
      )}

      {panel === 'banner' && (
        <EditorSheet title="Banner de portada" onClose={closePanel}>
          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-900/60 p-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-orange)]"
              checked={bannerShowShopName}
              disabled={busy}
              onChange={(e) => void saveBannerShowShopName(e.target.checked)}
            />
            <span className="text-sm text-zinc-200">
              <span className="font-medium">Mostrar nombre de la tienda en el banner</span>
              <span className="mt-1 block text-xs text-zinc-500">
                Desactivá esta opción si tu imagen de portada ya incluye el nombre del negocio.
              </span>
            </span>
          </label>
          <ShopBannerUpload
            shop={shop}
            onShopChange={(next) => {
              setShop(next)
              setBannerFocus(normalizeImageFocus(next.banner_focus_x, next.banner_focus_y))
            }}
            onUploaded={() => setBannerMediaKey((k) => k + 1)}
          />
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="mb-2 text-sm font-medium text-zinc-200">Vista en el banner</p>
            <p className="mb-3 text-xs text-zinc-500">
              La foto completa no entra en el banner: en el recuadro elegís qué parte se verá en la tienda (igual
              que arriba en la vista previa). No se recorta el archivo.
            </p>
            <ImageFocusControls
              value={bannerFocus}
              onChange={setBannerFocus}
              disabled={busy || !bannerFrameUrl}
              previewUrl={bannerFrameUrl}
              aspectWidth={2}
              aspectHeight={1}
              objectFit={isLogoBannerFrame ? 'contain' : 'cover'}
            />
            <button
              type="button"
              disabled={busy || !bannerFrameUrl || isLogoBannerFrame}
              onClick={() => void saveBannerFrame()}
              className="btn-primary mt-4 w-full"
            >
              {busy ? 'Guardando…' : 'Guardar vista del banner'}
            </button>
          </div>
        </EditorSheet>
      )}

    </div>
  )
}
