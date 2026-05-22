'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { updateProductImageFocus } from '@/app/actions/catalog'
import { revalidateStorefront, updateShopSettings } from '@/app/actions/shop'
import { ImageFocusControls } from '@/components/image-focus-controls'
import { ShopBannerUpload } from '@/components/shop-banner-upload'
import { Storefront } from '@/components/storefront'
import { CategoryIconPicker } from '@/components/category-icon-picker'
import { FeaturedProductsPicker } from '@/components/featured-products-picker'
import { ThemePicker } from '@/components/theme-picker'
import { categoryIconLabel } from '@/lib/category-icons'
import { cropImageToBlob, CROP_OUTPUT } from '@/lib/crop-image'
import { compressImageForUpload } from '@/lib/image-compress'
import { normalizeImageFocus, type ImageFocus } from '@/lib/image-focus'
import { getProductImageUrl, productImagePaths } from '@/lib/product-images'
import { getPublicUrlFromPath, shopPublicUrl } from '@/lib/publicUrl'
import { resolveShopBannerCropSourceUrl, shopBannerStoragePath } from '@/lib/shop-banner'
import { SHOP_IMAGES_CACHE_CONTROL } from '@/lib/storage-cache'
import { createClient } from '@/lib/supabase/browser'
import type { CategoryRow, ProductRow } from '@/types/catalog'
import type { ShopRow, ShopTheme } from '@/types/shop'

type Panel = null | 'appearance' | 'banner' | 'featured' | { type: 'product'; productId: string }

function patchProductInCategories(
  categories: CategoryRow[],
  productId: string,
  patch: Partial<ProductRow>,
): CategoryRow[] {
  const mapProducts = (list: ProductRow[]) =>
    list.map((p) => (p.id === productId ? { ...p, ...patch } : p))

  return categories.map((cat) => ({
    ...cat,
    subcategories: cat.subcategories.map((sub) => ({
      ...sub,
      products: mapProducts(sub.products),
    })),
  }))
}

function findProduct(categories: CategoryRow[], productId: string): ProductRow | null {
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      const p = sub.products.find((x) => x.id === productId)
      if (p) return p
    }
  }
  return null
}

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
        className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl"
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
  const [featuredIds, setFeaturedIds] = useState<string[]>(() => [...shop.featured_product_ids])
  const [categoryViewIcon, setCategoryViewIcon] = useState(shop.category_view_icon)
  const [bannerCropKey, setBannerCropKey] = useState(0)

  const productPanel = panel && typeof panel === 'object' ? panel : null
  const editingProduct = productPanel ? findProduct(categories, productPanel.productId) : null

  const closePanel = useCallback(() => setPanel(null), [])

  async function saveFeatured() {
    setBusy(true)
    setMsg(null)
    const res = await updateShopSettings(shop.id, { featured_product_ids: featuredIds })
    setBusy(false)
    if ('error' in res && res.error) {
      setMsg(res.error)
      return
    }
    setShop((s) => ({ ...s, featured_product_ids: featuredIds }))
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
    await revalidateStorefront(shop.slug)
    closePanel()
  }

  async function saveBannerCrop() {
    const sourceUrl = resolveShopBannerCropSourceUrl(shop, Date.now())
    if (!sourceUrl) {
      setMsg('No hay imagen de banner para recortar.')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const focus = normalizeImageFocus(bannerFocus.x, bannerFocus.y)
      const { w, h } = CROP_OUTPUT.banner
      const blob = await cropImageToBlob(sourceUrl, focus, w, h)
      const file = await compressImageForUpload(
        new File([blob], 'banner.webp', { type: 'image/webp' }),
        'banner',
      )
      const path = shopBannerStoragePath(shop.id)
      const sb = createClient()
      const { error: upErr } = await sb.storage.from('shop-images').upload(path, file, {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: SHOP_IMAGES_CACHE_CONTROL,
      })
      if (upErr) throw upErr

      const res = await updateShopSettings(shop.id, {
        banner_path: path,
        banner_focus_x: 50,
        banner_focus_y: 50,
      })
      if ('error' in res && res.error) throw new Error(res.error)

      setBannerFocus({ x: 50, y: 50 })
      setShop((s) => ({
        ...s,
        banner_path: path,
        banner_focus_x: 50,
        banner_focus_y: 50,
      }))
      setBannerCropKey((k) => k + 1)
      setMsg('Banner recortado y guardado (WebP).')
      await revalidateStorefront(shop.slug)
      closePanel()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al recortar el banner')
    }
    setBusy(false)
  }

  async function saveProductCrop() {
    if (!editingProduct?.image_path) return
    const sourceUrl = getPublicUrlFromPath(editingProduct.image_path)
    if (!sourceUrl) {
      setMsg('No hay imagen del producto.')
      return
    }
    setBusy(true)
    setMsg(null)
    try {
      const focus = normalizeImageFocus(editingProduct.image_focus_x, editingProduct.image_focus_y)
      const { main, thumb } = CROP_OUTPUT.product
      const [mainBlob, thumbBlob] = await Promise.all([
        cropImageToBlob(sourceUrl, focus, main.w, main.h),
        cropImageToBlob(sourceUrl, focus, thumb.w, thumb.h),
      ])
      const [mainFile, thumbFile] = await Promise.all([
        compressImageForUpload(new File([mainBlob], 'main.webp', { type: 'image/webp' }), 'main'),
        compressImageForUpload(new File([thumbBlob], 'thumb.webp', { type: 'image/webp' }), 'thumb'),
      ])
      const paths = productImagePaths(shop.id, editingProduct.id)
      const sb = createClient()
      const uploadOpts = {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: SHOP_IMAGES_CACHE_CONTROL,
      } as const
      const { error: upMain } = await sb.storage.from('shop-images').upload(paths.main, mainFile, uploadOpts)
      if (upMain) throw upMain
      const { error: upThumb } = await sb.storage.from('shop-images').upload(paths.thumb, thumbFile, uploadOpts)
      if (upThumb) throw upThumb

      const res = await updateProductImageFocus(shop.id, editingProduct.id, 50, 50)
      if ('error' in res && res.error) throw new Error(res.error)

      setCategories((cats) =>
        patchProductInCategories(cats, editingProduct.id, {
          image_focus_x: 50,
          image_focus_y: 50,
        }),
      )
      setMsg('Foto recortada a tamaño de vitrina y guardada.')
      await revalidateStorefront(shop.slug)
      closePanel()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error al recortar la foto')
    }
    setBusy(false)
  }

  const bannerCropPreviewUrl = useMemo(
    () => resolveShopBannerCropSourceUrl(shop, bannerCropKey),
    [shop.banner_path, shop.theme.templateId, bannerCropKey],
  )

  useEffect(() => {
    setBannerCropKey((k) => k + 1)
  }, [shop.banner_path, shop.theme.templateId])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3">
        <div>
          <p className="font-semibold text-white">Editar tienda</p>
          <p className="text-xs text-zinc-400">Vista previa — tocá las zonas resaltadas para editar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="store-edit-chip"
            onClick={() => {
              setFeaturedIds([...shop.featured_product_ids])
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
          key={`preview-${shop.banner_path ?? 'template'}-${bannerCropKey}`}
          shop={{ ...shop, theme, category_view_icon: categoryViewIcon }}
          categories={categories}
          mode="edit"
          onOpenBannerEditor={() => setPanel('banner')}
          onOpenAppearanceEditor={() => setPanel('appearance')}
          onOpenProductFocus={(productId) => setPanel({ type: 'product', productId })}
          onOpenFeaturedEditor={() => {
            setFeaturedIds([...shop.featured_product_ids])
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
          <ThemePicker value={theme} onChange={handleThemeChange} />
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
          <ShopBannerUpload
            shop={shop}
            onShopChange={(next) => {
              setShop(next)
              setBannerFocus(normalizeImageFocus(next.banner_focus_x, next.banner_focus_y))
            }}
          />
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="mb-2 text-sm font-medium text-zinc-200">Encuadre del banner</p>
            <p className="mb-3 text-xs text-zinc-500">
              Recorta la imagen que ves arriba (tu foto o la de la plantilla). Al guardar, se sube como banner
              propio de la tienda.
            </p>
            <ImageFocusControls
              value={bannerFocus}
              onChange={setBannerFocus}
              disabled={busy}
              previewUrl={bannerCropPreviewUrl}
              aspectWidth={2}
              aspectHeight={1}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveBannerCrop()}
              className="btn-primary mt-4 w-full"
            >
              {busy ? 'Recortando…' : 'Guardar recorte del banner'}
            </button>
          </div>
        </EditorSheet>
      )}

      {productPanel && editingProduct && (
        <EditorSheet title={`Encuadre: ${editingProduct.name}`} onClose={closePanel}>
          <ImageFocusControls
            value={normalizeImageFocus(editingProduct.image_focus_x, editingProduct.image_focus_y)}
            onChange={(next) => {
              setCategories((cats) =>
                patchProductInCategories(cats, editingProduct.id, {
                  image_focus_x: next.x,
                  image_focus_y: next.y,
                }),
              )
            }}
            disabled={busy}
            previewUrl={getProductImageUrl(editingProduct.image_path, 'full')}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveProductCrop()}
            className="btn-primary mt-4 w-full"
          >
            {busy ? 'Recortando…' : 'Guardar recorte de la foto'}
          </button>
        </EditorSheet>
      )}
    </div>
  )
}
