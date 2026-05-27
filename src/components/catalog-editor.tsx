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
import { SettingsCollapsible } from '@/components/settings-collapsible'
import { ProductBasicsEditorDialog } from '@/components/product-basics-editor-dialog'
import { ProductDetailsEditorDialog } from '@/components/product-details-editor-dialog'
import { updateProductDetails } from '@/app/actions/catalog'
import { categoryIconLabel } from '@/lib/category-icons'
import { SANITIZE_LIMITS, sanitizePlainText } from '@/lib/sanitize'
import type { CategoryRow, ProductRow } from '@/types/catalog'
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
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addProductCategoryId, setAddProductCategoryId] = useState<string | null>(null)
  const [newProductName, setNewProductName] = useState('')
  const [newProductPrice, setNewProductPrice] = useState('')
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

  async function addCategory(nameInput?: string) {
    const name =
      nameInput != null
        ? sanitizePlainText(nameInput, SANITIZE_LIMITS.categoryName)
        : promptPlainText('Nombre de la categoría', SANITIZE_LIMITS.categoryName)
    if (!name) return
    setBusy(true)
    setCatalogError(null)
    const sort = categories.length
    const { error } = await sb.from('categories').insert({
      shop_id: shop.id,
      name,
      sort_order: sort,
      icon: 'tag',
    })
    setBusy(false)
    if (error) {
      setCatalogError(error.message)
      return
    }
    if (nameInput != null) {
      setNewCategoryName('')
      setShowAddCategoryForm(false)
    }
    await publishCatalog()
  }

  async function setCategoryIcon(categoryId: string, icon: string) {
    setBusy(true)
    setCatalogError(null)
    const { error } = await sb.from('categories').update({ icon }).eq('id', categoryId)
    setBusy(false)
    if (error) {
      setCatalogError(error.message)
      return
    }
    await publishCatalog()
  }

  async function deleteCategory(categoryId: string, name: string) {
    if (!confirm(`¿Eliminar la categoría "${name}" y todos sus productos?`)) {
      return
    }
    setBusy(true)
    setCatalogError(null)
    const cat = categories.find((c) => c.id === categoryId)
    const products = (cat?.products ?? []).map((p) => ({ id: p.id, image_path: p.image_path }))
    await removeProductImages(sb, shop.id, products)
    const { error } = await sb.from('categories').delete().eq('id', categoryId).eq('shop_id', shop.id)
    setBusy(false)
    if (error) {
      setCatalogError(error.message)
      return
    }
    if (addProductCategoryId === categoryId) {
      setAddProductCategoryId(null)
      setNewProductName('')
      setNewProductPrice('')
    }
    await publishCatalog()
  }

  async function addProduct(categoryId: string, nameInput?: string, priceInput?: string) {
    if (productCount >= limits.maxProducts) {
      setCatalogError(`Tu plan permite hasta ${limits.maxProducts} productos.`)
      return
    }
    const name =
      nameInput != null
        ? sanitizePlainText(nameInput, SANITIZE_LIMITS.productName)
        : promptPlainText('Nombre del producto', SANITIZE_LIMITS.productName)
    if (!name) return

    const priceStr = priceInput ?? prompt('Precio (número)', '0')
    if (priceStr == null) return
    const price = Number(priceStr.replace(',', '.').trim())
    if (!Number.isFinite(price) || price < 0) {
      setCatalogError('Ingresá un precio válido (número mayor o igual a 0).')
      return
    }

    setBusy(true)
    setCatalogError(null)
    const { error } = await sb.from('products').insert({
      shop_id: shop.id,
      category_id: categoryId,
      name,
      price,
      stock_quantity: 1,
      active: true,
      sort_order: 0,
    })
    setBusy(false)
    if (error) {
      setCatalogError(error.message)
      return
    }
    if (nameInput != null) {
      setAddProductCategoryId(null)
      setNewProductName('')
      setNewProductPrice('')
    }
    await publishCatalog()
  }

  async function uploadProductImage(productId: string, file: File | null) {
    if (!file) return
    setBusy(true)
    setCatalogError(null)
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
      setCatalogError(e instanceof Error ? e.message : 'Error al subir imagen')
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
    setCatalogError(null)
    const { error } = await sb.from('products').update({ active: !active }).eq('id', productId)
    setBusy(false)
    if (error) {
      setCatalogError(error.message)
      return
    }
    await publishCatalog()
  }

  async function toggleStockState(productId: string, stockQuantity: number) {
    setBusy(true)
    setCatalogError(null)
    const nextStock = stockQuantity > 0 ? 0 : 1
    const { error } = await sb.from('products').update({ stock_quantity: nextStock }).eq('id', productId)
    setBusy(false)
    if (error) {
      setCatalogError(error.message)
      return
    }
    await publishCatalog()
  }

  async function deleteProduct(productId: string) {
    setBusy(true)
    setCatalogError(null)
    const { data: row } = await sb
      .from('products')
      .select('image_path')
      .eq('id', productId)
      .maybeSingle()
    const toDelete = pathsToRemove(shop.id, productId, row?.image_path ?? null)
    if (toDelete.length > 0) {
      await sb.storage.from('shop-images').remove(toDelete)
    }
    const { error } = await sb.from('products').delete().eq('id', productId)
    setBusy(false)
    if (error) {
      setCatalogError(error.message)
      return
    }
    await publishCatalog()
  }

  async function editCategoryName(categoryId: string, current: string) {
    const name = promptPlainText('Nombre de la categoría', SANITIZE_LIMITS.categoryName, current)
    if (!name || name === current) return
    setBusy(true)
    setCatalogError(null)
    const { error } = await sb
      .from('categories')
      .update({ name })
      .eq('id', categoryId)
      .eq('shop_id', shop.id)
    setBusy(false)
    if (error) {
      setCatalogError(error.message)
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
        <button
          type="button"
          disabled={busy}
          onClick={() => setShowAddCategoryForm((prev) => !prev)}
          className="btn-primary text-sm"
        >
          + Categoría
        </button>
      </div>

      {catalogError && (
        <p className="text-sm text-red-400" role="alert">
          {catalogError}
        </p>
      )}

      {showAddCategoryForm && (
        <form
          className="card space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void addCategory(newCategoryName)
          }}
        >
          <label className="block text-sm text-zinc-300" htmlFor="new-category-name">
            Nombre de la categoría
          </label>
          <input
            id="new-category-name"
            type="text"
            maxLength={SANITIZE_LIMITS.categoryName}
            disabled={busy}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Ej. Ropa, Accesorios, Comida"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-brand"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary text-sm">
              {busy ? 'Guardando…' : 'Guardar categoría'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setShowAddCategoryForm(false)
                setNewCategoryName('')
              }}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

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
              {/** Category actions with consistent framed style */}
              <button
                type="button"
                disabled={busy}
                className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-sm text-amber-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void editCategoryName(cat.id, cat.name)}
              >
                Editar
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-sm text-amber-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  setCatalogError(null)
                  setAddProductCategoryId((prev) => (prev === cat.id ? null : cat.id))
                  setNewProductName('')
                  setNewProductPrice('')
                }}
              >
                + Producto
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-sm text-red-400 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void deleteCategory(cat.id, cat.name)}
              >
                Eliminar categoría
              </button>
            </div>
          </div>
          <SettingsCollapsible
            title={`Icono ${cat.name}`}
            subtitle={categoryIconLabel(cat.icon)}
            defaultOpen={false}
          >
            <CategoryIconPicker
              value={cat.icon}
              disabled={busy}
              onChange={(icon) => void setCategoryIcon(cat.id, icon)}
            />
          </SettingsCollapsible>

          {addProductCategoryId === cat.id && (
            <form
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                void addProduct(cat.id, newProductName, newProductPrice)
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Nombre del producto</span>
                  <input
                    type="text"
                    maxLength={SANITIZE_LIMITS.productName}
                    disabled={busy}
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ej. Remera básica"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-brand"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Precio</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={busy}
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-brand"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="btn-primary text-sm">
                  {busy ? 'Guardando…' : 'Guardar producto'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAddProductCategoryId(null)
                    setNewProductName('')
                    setNewProductPrice('')
                  }}
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {cat.products.length === 0 && addProductCategoryId !== cat.id && (
            <p className="text-xs text-zinc-500">Sin productos. Usá + Producto para cargar el primero.</p>
          )}

          <ProductList
            products={cat.products}
            busy={busy}
            onUpload={uploadProductImage}
            onEditBasics={openBasicsEditor}
            onEditDetails={openDetailsEditor}
            onToggle={toggleActive}
            onToggleStock={toggleStockState}
            onDelete={deleteProduct}
          />
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
  onToggleStock,
  onDelete,
}: {
  products: ProductRow[]
  busy: boolean
  onUpload: (id: string, f: File | null) => void
  onEditBasics: (id: string, name: string, price: number) => void
  onEditDetails: (id: string, name: string, current: string | null) => void
  onToggle: (id: string, active: boolean) => void
  onToggleStock: (id: string, stockQuantity: number) => void
  onDelete: (id: string) => void
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  if (products.length === 0) return null
  return (
    <ul className="space-y-2">
      {products.map((p) => {
        const img = getPublicUrlFromPath(p.image_path)
        const inStock = p.stock_quantity > 0
        const actionBtnClass =
          'rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60'
        const actionTextClass = 'text-amber-300'
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
                  {formatMoneyArs(Number(p.price))} · {inStock ? 'Disponible' : 'Agotado'}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-800/80 pt-2">
              <button
                type="button"
                disabled={busy}
                className={`${actionBtnClass} ${actionTextClass}`}
                onClick={() => onEditBasics(p.id, p.name, Number(p.price))}
              >
                Editar
              </button>
              <label className={`inline-flex shrink-0 cursor-pointer items-center ${actionBtnClass} ${actionTextClass}`}>
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
                className={`${actionBtnClass} ${actionTextClass}`}
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
                className={`${actionBtnClass} ${actionTextClass}`}
                onClick={() => onToggleStock(p.id, p.stock_quantity)}
              >
                {inStock ? 'Disponible' : 'Agotado'}
              </button>
              <button
                type="button"
                disabled={busy}
                className={`${actionBtnClass} ${actionTextClass}`}
                onClick={() => onToggle(p.id, p.active)}
              >
                {p.active ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                type="button"
                disabled={busy}
                className={`${actionBtnClass} text-red-400`}
                onClick={() => setPendingDeleteId((prev) => (prev === p.id ? null : p.id))}
              >
                Eliminar
              </button>
            </div>
            {pendingDeleteId === p.id && (
              <div className="mt-2 rounded-lg border border-red-900/60 bg-red-950/20 p-2">
                <p className="text-xs text-red-200">
                  ¿Eliminar <span className="font-semibold">{p.name}</span>? Esta acción no se puede deshacer.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-md border border-red-700 bg-red-900/40 px-2 py-1 text-xs text-red-200 transition hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => {
                      setPendingDeleteId(null)
                      onDelete(p.id)
                    }}
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => setPendingDeleteId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
