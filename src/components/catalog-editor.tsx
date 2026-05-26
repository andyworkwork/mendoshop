'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { revalidateStorefront } from '@/app/actions/shop'
import { compressImageForUpload } from '@/lib/image-compress'
import { formatMoneyArs } from '@/lib/format'
import { countProducts } from '@/lib/fetch-catalog'
import { PLAN_LIMITS } from '@/lib/plans'
import { getPublicUrlFromPath } from '@/lib/publicUrl'
import { pathsToRemove, productImagePaths } from '@/lib/product-images'
import { SHOP_IMAGES_CACHE_CONTROL } from '@/lib/storage-cache'
import { CategoryIconPicker } from '@/components/category-icon-picker'
import { ProductBasicsEditorDialog } from '@/components/product-basics-editor-dialog'
import { ProductDetailsEditorDialog } from '@/components/product-details-editor-dialog'
import { updateProductDetails } from '@/app/actions/catalog'
import { categoryIconLabel } from '@/lib/category-icons'
import { SANITIZE_LIMITS, sanitizePlainText } from '@/lib/sanitize'
import type { CategoryRow } from '@/types/catalog'
import type { ShopRow } from '@/types/shop'

function promptPlainText(label: string, maxLength: number, current?: string): string | null {
  const raw = prompt(label, current)
  if (raw == null) return null
  const value = sanitizePlainText(raw, maxLength)
  return value.length > 0 ? value : null
}

async function removeProductImages(
  sb: ReturnType<typeof createClient>,
  shopId: string,
  products: { id: string; image_path: string | null }[],
) {
  for (const p of products) {
    const toDelete = pathsToRemove(shopId, p.id, p.image_path)
    if (toDelete.length > 0) {
      await sb.storage.from('shop-images').remove(toDelete)
    }
  }
}

export function CatalogEditor({
  shop,
  initial,
}: {
  shop: ShopRow
  initial: CategoryRow[]
}) {
  const [categories, setCategories] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [detailsEditor, setDetailsEditor] = useState<{
    productId: string
    productName: string
    details: string
  } | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [basicsEditor, setBasicsEditor] = useState<{
    productId: string
    name: string
    price: number
  } | null>(null)
  const [basicsError, setBasicsError] = useState<string | null>(null)
  const sb = createClient()
  const limits = PLAN_LIMITS[shop.plan]
  const productCount = countProducts(categories)

  const refresh = useCallback(async () => {
    const { fetchCategoriesWithNested } = await import('@/lib/fetch-catalog')
    const tree = await fetchCategoriesWithNested(sb, shop.id, { includeInactive: true })
    setCategories(tree)
  }, [sb, shop.id])

  const publishCatalog = useCallback(async () => {
    await refresh()
    await revalidateStorefront(shop.slug)
  }, [refresh, shop.slug])

  async function addCategory() {
    const name = promptPlainText('Nombre de la categoría', SANITIZE_LIMITS.categoryName)
    if (!name) return
    setBusy(true)
    const sort = categories.length
    await sb.from('categories').insert({
      shop_id: shop.id,
      name,
      sort_order: sort,
      icon: 'tag',
    })
    setBusy(false)
    await publishCatalog()
  }

  async function setCategoryIcon(categoryId: string, icon: string) {
    setBusy(true)
    await sb.from('categories').update({ icon }).eq('id', categoryId)
    setBusy(false)
    await publishCatalog()
  }

  async function deleteCategory(categoryId: string, name: string) {
    if (!confirm(`¿Eliminar la categoría "${name}" y todo su contenido (subcategorías y productos)?`)) {
      return
    }
    setBusy(true)
    const cat = categories.find((c) => c.id === categoryId)
    const products: { id: string; image_path: string | null }[] = []
    for (const sub of cat?.subcategories ?? []) {
      for (const p of sub.products) {
        products.push({ id: p.id, image_path: p.image_path })
      }
    }
    await removeProductImages(sb, shop.id, products)
    await sb.from('categories').delete().eq('id', categoryId).eq('shop_id', shop.id)
    setBusy(false)
    await publishCatalog()
  }

  async function addSubcategory(categoryId: string) {
    const name = promptPlainText('Nombre de la subcategoría', SANITIZE_LIMITS.subcategoryName)
    if (!name) return
    setBusy(true)
    await sb.from('subcategories').insert({
      shop_id: shop.id,
      category_id: categoryId,
      name,
      sort_order: 0,
    })
    setBusy(false)
    await publishCatalog()
  }

  async function deleteSubcategory(subcategoryId: string, name: string) {
    if (!confirm(`¿Eliminar la subcategoría "${name}" y todos sus productos?`)) return
    setBusy(true)
    const { data: prods } = await sb
      .from('products')
      .select('id, image_path')
      .eq('subcategory_id', subcategoryId)
      .eq('shop_id', shop.id)
    await removeProductImages(sb, shop.id, prods ?? [])
    await sb.from('subcategories').delete().eq('id', subcategoryId).eq('shop_id', shop.id)
    setBusy(false)
    await publishCatalog()
  }

  async function addProduct(subcategoryId: string) {
    if (productCount >= limits.maxProducts) {
      alert(`Tu plan permite hasta ${limits.maxProducts} productos.`)
      return
    }
    const name = promptPlainText('Nombre del producto', SANITIZE_LIMITS.productName)
    if (!name) return
    const priceStr = prompt('Precio (número)', '0')
    const price = Number(priceStr?.replace(',', '.'))
    if (!Number.isFinite(price) || price < 0) return
    setBusy(true)
    await sb.from('products').insert({
      shop_id: shop.id,
      subcategory_id: subcategoryId,
      subsubcategoria_id: null,
      name,
      price,
      stock_quantity: 1,
      active: true,
      sort_order: 0,
    })
    setBusy(false)
    await publishCatalog()
  }

  async function uploadProductImage(productId: string, file: File | null) {
    if (!file) return
    setBusy(true)
    try {
      const { data: existing } = await sb
        .from('products')
        .select('image_path')
        .eq('id', productId)
        .maybeSingle()

      const { main, thumb } = productImagePaths(shop.id, productId)
      const [mainFile, thumbFile] = await Promise.all([
        compressImageForUpload(file, 'main'),
        compressImageForUpload(file, 'thumb'),
      ])

      const uploadOpts = {
        upsert: true,
        contentType: 'image/webp',
        cacheControl: SHOP_IMAGES_CACHE_CONTROL,
      } as const

      const { error: upMain } = await sb.storage.from('shop-images').upload(main, mainFile, uploadOpts)
      if (upMain) throw upMain
      const { error: upThumb } = await sb.storage.from('shop-images').upload(thumb, thumbFile, uploadOpts)
      if (upThumb) throw upThumb

      const toDelete = pathsToRemove(shop.id, productId, existing?.image_path ?? null).filter(
        (p) => p !== main && p !== thumb,
      )
      if (toDelete.length > 0) {
        await sb.storage.from('shop-images').remove(toDelete)
      }

      await sb.from('products').update({ image_path: main }).eq('id', productId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al subir imagen')
    }
    setBusy(false)
    await publishCatalog()
  }

  function openDetailsEditor(productId: string, productName: string, current: string | null) {
    setDetailsError(null)
    setDetailsEditor({
      productId,
      productName,
      details: current ?? '',
    })
  }

  async function saveProductDetails(text: string) {
    if (!detailsEditor) return
    setBusy(true)
    setDetailsError(null)
    const res = await updateProductDetails(shop.id, detailsEditor.productId, text.trim() || null)
    setBusy(false)
    if ('error' in res) {
      setDetailsError(res.error)
      return
    }
    setDetailsEditor(null)
    await publishCatalog()
  }

  async function toggleActive(productId: string, active: boolean) {
    setBusy(true)
    await sb.from('products').update({ active: !active }).eq('id', productId)
    setBusy(false)
    await publishCatalog()
  }

  async function deleteProduct(productId: string) {
    if (!confirm('¿Eliminar este producto?')) return
    setBusy(true)
    const { data: row } = await sb
      .from('products')
      .select('image_path')
      .eq('id', productId)
      .maybeSingle()
    const toDelete = pathsToRemove(shop.id, productId, row?.image_path ?? null)
    if (toDelete.length > 0) {
      await sb.storage.from('shop-images').remove(toDelete)
    }
    await sb.from('products').delete().eq('id', productId)
    setBusy(false)
    await publishCatalog()
  }

  async function editCategoryName(categoryId: string, current: string) {
    const name = promptPlainText('Nombre de la categoría', SANITIZE_LIMITS.categoryName, current)
    if (!name || name === current) return
    setBusy(true)
    const { error } = await sb
      .from('categories')
      .update({ name })
      .eq('id', categoryId)
      .eq('shop_id', shop.id)
    setBusy(false)
    if (error) {
      alert(error.message)
      return
    }
    await publishCatalog()
  }

  async function editSubcategoryName(subcategoryId: string, current: string) {
    const name = promptPlainText('Nombre de la subcategoría', SANITIZE_LIMITS.subcategoryName, current)
    if (!name || name === current) return
    setBusy(true)
    const { error } = await sb
      .from('subcategories')
      .update({ name })
      .eq('id', subcategoryId)
      .eq('shop_id', shop.id)
    setBusy(false)
    if (error) {
      alert(error.message)
      return
    }
    await publishCatalog()
  }

  function openBasicsEditor(productId: string, name: string, price: number) {
    setBasicsError(null)
    setBasicsEditor({ productId, name, price })
  }

  async function saveProductBasics(name: string, price: number) {
    if (!basicsEditor) return
    const safeName = sanitizePlainText(name, SANITIZE_LIMITS.productName)
    if (!safeName) {
      setBasicsError('El nombre del producto no es válido.')
      return
    }
    setBusy(true)
    setBasicsError(null)
    const { error } = await sb
      .from('products')
      .update({ name: safeName, price })
      .eq('id', basicsEditor.productId)
      .eq('shop_id', shop.id)
    setBusy(false)
    if (error) {
      setBasicsError(error.message)
      return
    }
    setBasicsEditor(null)
    await publishCatalog()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-400">
          Productos: {productCount} / {limits.maxProducts}
        </p>
        <button type="button" disabled={busy} onClick={addCategory} className="btn-primary text-sm">
          + Categoría
        </button>
      </div>

      {basicsError && (
        <p className="text-sm text-red-400" role="alert">
          {basicsError}
        </p>
      )}

      {categories.length === 0 && (
        <p className="text-zinc-500">Empezá creando una categoría (ej. Ropa, Accesorios, Comida).</p>
      )}

      {categories.map((cat) => (
        <section key={cat.id} className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-brand">{cat.name}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="text-sm text-brand-accent"
                onClick={() => void editCategoryName(cat.id, cat.name)}
              >
                Editar
              </button>
              <button
                type="button"
                disabled={busy}
                className="text-sm text-brand-accent"
                onClick={() => addSubcategory(cat.id)}
              >
                + Subcategoría
              </button>
              <button
                type="button"
                disabled={busy}
                className="text-sm text-red-400"
                onClick={() => void deleteCategory(cat.id, cat.name)}
              >
                Eliminar categoría
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500">Icono en la tienda ({categoryIconLabel(cat.icon)})</p>
            <CategoryIconPicker
              value={cat.icon}
              disabled={busy}
              onChange={(icon) => void setCategoryIcon(cat.id, icon)}
            />
          </div>
          {cat.subcategories.length === 0 && (
            <p className="text-xs text-zinc-500">Sin subcategorías. Agregá una para cargar productos.</p>
          )}
          {cat.subcategories.map((sub) => (
            <div key={sub.id} className="ml-2 border-l border-zinc-700 pl-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{sub.name}</h3>
                <button
                  type="button"
                  className="text-xs text-brand-accent"
                  disabled={busy}
                  onClick={() => void editSubcategoryName(sub.id, sub.name)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="text-xs text-brand-accent"
                  disabled={busy}
                  onClick={() => addProduct(sub.id)}
                >
                  + Producto
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="text-xs text-red-400"
                  onClick={() => void deleteSubcategory(sub.id, sub.name)}
                >
                  Eliminar subcategoría
                </button>
              </div>
              <ProductList
                products={sub.products}
                busy={busy}
                onUpload={uploadProductImage}
                onEditBasics={openBasicsEditor}
                onEditDetails={openDetailsEditor}
                onToggle={toggleActive}
                onDelete={deleteProduct}
              />
            </div>
          ))}
        </section>
      ))}

      {detailsError && (
        <p className="text-sm text-red-400" role="alert">
          {detailsError}
        </p>
      )}

      <ProductDetailsEditorDialog
        open={Boolean(detailsEditor)}
        productName={detailsEditor?.productName ?? ''}
        initialDetails={detailsEditor?.details ?? ''}
        busy={busy}
        onClose={() => {
          if (!busy) setDetailsEditor(null)
        }}
        onSave={(text) => void saveProductDetails(text)}
      />

      <ProductBasicsEditorDialog
        open={Boolean(basicsEditor)}
        productName={basicsEditor?.name ?? ''}
        initialPrice={basicsEditor?.price ?? 0}
        busy={busy}
        onClose={() => {
          if (!busy) setBasicsEditor(null)
        }}
        onSave={(name, price) => void saveProductBasics(name, price)}
      />
    </div>
  )
}

function ProductList({
  products,
  busy,
  onUpload,
  onEditBasics,
  onEditDetails,
  onToggle,
  onDelete,
}: {
  products: CategoryRow['subcategories'][0]['products']
  busy: boolean
  onUpload: (id: string, f: File | null) => void
  onEditBasics: (id: string, name: string, price: number) => void
  onEditDetails: (id: string, name: string, current: string | null) => void
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  if (products.length === 0) return null
  return (
    <ul className="space-y-2">
      {products.map((p) => {
        const img = getPublicUrlFromPath(p.image_path)
        return (
          <li
            key={p.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2"
          >
            <div className="flex gap-3">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded bg-zinc-800" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`font-medium text-sm ${!p.active ? 'line-through text-zinc-500' : ''}`}>
                  {p.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatMoneyArs(Number(p.price))} · Stock {p.stock_quantity}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-800/80 pt-2">
              <button
                type="button"
                disabled={busy}
                className="text-xs text-brand-accent"
                onClick={() => onEditBasics(p.id, p.name, Number(p.price))}
              >
                Editar
              </button>
              <label className="inline-flex shrink-0 cursor-pointer items-center text-xs text-brand-accent">
                <span>Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => onUpload(p.id, e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                disabled={busy}
                className="text-xs text-brand-accent"
                onClick={() => onEditDetails(p.id, p.name, p.product_details)}
              >
                Detalles{p.product_details?.trim() ? ' ✓' : ''}
              </button>
              {p.detail_view_count > 0 && (
                <span className="text-xs text-zinc-500">{p.detail_view_count} vistas</span>
              )}
              <button
                type="button"
                disabled={busy}
                className="text-xs text-zinc-300"
                onClick={() => onToggle(p.id, p.active)}
              >
                {p.active ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                type="button"
                disabled={busy}
                className="text-xs text-red-400"
                onClick={() => onDelete(p.id)}
              >
                Eliminar
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
