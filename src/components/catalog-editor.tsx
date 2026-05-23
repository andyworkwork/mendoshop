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
import { ProductDetailsEditorDialog } from '@/components/product-details-editor-dialog'
import { updateProductDetails } from '@/app/actions/catalog'
import { categoryIconLabel } from '@/lib/category-icons'
import type { CategoryRow } from '@/types/catalog'
import type { ShopRow } from '@/types/shop'

type NamePriceDraft = {
  categories: {
    id: string
    name: string
    subcategories: {
      id: string
      name: string
      products: { id: string; name: string; price: string }[]
    }[]
  }[]
}

function buildNamePriceDraft(categories: CategoryRow[]): NamePriceDraft {
  return {
    categories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      subcategories: cat.subcategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        products: sub.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: String(p.price),
        })),
      })),
    })),
  }
}

function parsePriceInput(raw: string): number | null {
  const n = Number(raw.replace(',', '.').trim())
  if (!Number.isFinite(n) || n < 0) return null
  return n
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
  const [bulkEdit, setBulkEdit] = useState(false)
  const [draft, setDraft] = useState<NamePriceDraft | null>(null)
  const [bulkError, setBulkError] = useState<string | null>(null)
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
    const name = prompt('Nombre de la categoría')
    if (!name?.trim()) return
    setBusy(true)
    const sort = categories.length
    await sb.from('categories').insert({
      shop_id: shop.id,
      name: name.trim(),
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
    const name = prompt('Nombre de la subcategoría')
    if (!name?.trim()) return
    setBusy(true)
    await sb.from('subcategories').insert({
      shop_id: shop.id,
      category_id: categoryId,
      name: name.trim(),
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
    const name = prompt('Nombre del producto')
    if (!name?.trim()) return
    const priceStr = prompt('Precio (número)', '0')
    const price = Number(priceStr?.replace(',', '.'))
    if (!Number.isFinite(price) || price < 0) return
    setBusy(true)
    await sb.from('products').insert({
      shop_id: shop.id,
      subcategory_id: subcategoryId,
      subsubcategoria_id: null,
      name: name.trim(),
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

  function startBulkEdit() {
    setBulkError(null)
    setDraft(buildNamePriceDraft(categories))
    setBulkEdit(true)
  }

  function cancelBulkEdit() {
    setBulkEdit(false)
    setDraft(null)
    setBulkError(null)
  }

  async function saveBulkEdit() {
    if (!draft) return
    setBulkError(null)
    setBusy(true)

    for (const cat of draft.categories) {
      const catName = cat.name.trim()
      if (!catName) {
        setBulkError('Todas las categorías necesitan un nombre.')
        setBusy(false)
        return
      }
      for (const sub of cat.subcategories) {
        const subName = sub.name.trim()
        if (!subName) {
          setBulkError('Todas las subcategorías necesitan un nombre.')
          setBusy(false)
          return
        }
        for (const p of sub.products) {
          const pName = p.name.trim()
          if (!pName) {
            setBulkError('Todos los productos necesitan un nombre.')
            setBusy(false)
            return
          }
          const price = parsePriceInput(p.price)
          if (price === null) {
            setBulkError(`Precio inválido en «${pName}». Usá un número ≥ 0.`)
            setBusy(false)
            return
          }
        }
      }
    }

    try {
      for (const cat of draft.categories) {
        const { error } = await sb
          .from('categories')
          .update({ name: cat.name.trim() })
          .eq('id', cat.id)
          .eq('shop_id', shop.id)
        if (error) throw new Error(error.message)

        for (const sub of cat.subcategories) {
          const { error: subErr } = await sb
            .from('subcategories')
            .update({ name: sub.name.trim() })
            .eq('id', sub.id)
            .eq('shop_id', shop.id)
          if (subErr) throw new Error(subErr.message)

          for (const p of sub.products) {
            const price = parsePriceInput(p.price)!
            const { error: prodErr } = await sb
              .from('products')
              .update({ name: p.name.trim(), price })
              .eq('id', p.id)
              .eq('shop_id', shop.id)
            if (prodErr) throw new Error(prodErr.message)
          }
        }
      }

      setBulkEdit(false)
      setDraft(null)
      await publishCatalog()
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : 'No se pudieron guardar los cambios.')
    }
    setBusy(false)
  }

  const catalogView = bulkEdit && draft ? draft.categories : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-400">
          Productos: {productCount} / {limits.maxProducts}
        </p>
        <div className="flex flex-wrap gap-2">
          {bulkEdit ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveBulkEdit()}
                className="btn-primary text-sm"
              >
                {busy ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={cancelBulkEdit}
                className="rounded-xl border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy || categories.length === 0}
                onClick={startBulkEdit}
                className="rounded-xl border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
              >
                Editar nombres y precios
              </button>
              <button type="button" disabled={busy} onClick={addCategory} className="btn-primary text-sm">
                + Categoría
              </button>
            </>
          )}
        </div>
      </div>

      {bulkEdit && (
        <p className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-zinc-200">
          Modo edición: cambiá nombres y precios abajo. Al terminar, tocá{' '}
          <span className="font-semibold text-brand">Guardar cambios</span>.
        </p>
      )}

      {bulkError && (
        <p className="text-sm text-red-400" role="alert">
          {bulkError}
        </p>
      )}

      {categories.length === 0 && (
        <p className="text-zinc-500">Empezá creando una categoría (ej. Ropa, Accesorios, Comida).</p>
      )}

      {(catalogView ?? categories).map((cat, catIdx) => {
        const fullCat = categories[catIdx]!
        const catName = bulkEdit && draft ? cat.name : fullCat.name
        const subs = bulkEdit && draft ? cat.subcategories : fullCat.subcategories

        return (
          <section key={fullCat.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {bulkEdit && draft ? (
                <input
                  className="input max-w-md flex-1 font-semibold text-brand"
                  value={catName}
                  disabled={busy}
                  onChange={(e) => {
                    const name = e.target.value
                    setDraft((d) => {
                      if (!d) return d
                      return {
                        categories: d.categories.map((c) =>
                          c.id === fullCat.id ? { ...c, name } : c,
                        ),
                      }
                    })
                  }}
                  aria-label="Nombre de categoría"
                />
              ) : (
                <h2 className="font-semibold text-brand">{fullCat.name}</h2>
              )}
              {!bulkEdit && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    className="text-sm text-brand-accent"
                    onClick={() => addSubcategory(fullCat.id)}
                  >
                    + Subcategoría
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="text-sm text-red-400"
                    onClick={() => void deleteCategory(fullCat.id, fullCat.name)}
                  >
                    Eliminar categoría
                  </button>
                </div>
              )}
            </div>
            {!bulkEdit && (
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">
                  Icono en la tienda ({categoryIconLabel(fullCat.icon)})
                </p>
                <CategoryIconPicker
                  value={fullCat.icon}
                  disabled={busy}
                  onChange={(icon) => void setCategoryIcon(fullCat.id, icon)}
                />
              </div>
            )}
            {subs.length === 0 && (
              <p className="text-xs text-zinc-500">Sin subcategorías. Agregá una para cargar productos.</p>
            )}
            {subs.map((sub, subIdx) => {
              const fullSub = fullCat.subcategories[subIdx]!
              const subName = bulkEdit && draft ? sub.name : fullSub.name
              const draftProducts =
                bulkEdit && draft ? draft.categories[catIdx]!.subcategories[subIdx]!.products : null

              return (
                <div key={fullSub.id} className="ml-2 border-l border-zinc-700 pl-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {bulkEdit && draft ? (
                      <input
                        className="input max-w-xs flex-1 font-medium"
                        value={subName}
                        disabled={busy}
                        onChange={(e) => {
                          const name = e.target.value
                          setDraft((d) => {
                            if (!d) return d
                            return {
                              categories: d.categories.map((c) =>
                                c.id !== fullCat.id
                                  ? c
                                  : {
                                      ...c,
                                      subcategories: c.subcategories.map((s) =>
                                        s.id === fullSub.id ? { ...s, name } : s,
                                      ),
                                    },
                              ),
                            }
                          })
                        }}
                        aria-label="Nombre de subcategoría"
                      />
                    ) : (
                      <h3 className="font-medium">{fullSub.name}</h3>
                    )}
                    {!bulkEdit && (
                      <>
                        <button
                          type="button"
                          className="text-xs text-brand-accent"
                          disabled={busy}
                          onClick={() => addProduct(fullSub.id)}
                        >
                          + Producto
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="text-xs text-red-400"
                          onClick={() => void deleteSubcategory(fullSub.id, fullSub.name)}
                        >
                          Eliminar subcategoría
                        </button>
                      </>
                    )}
                  </div>
                  {draftProducts ? (
                    <BulkEditProductList
                      products={draftProducts}
                      busy={busy}
                      onChangeName={(productId, name) => {
                        setDraft((d) => {
                          if (!d) return d
                          return {
                            categories: d.categories.map((c) =>
                              c.id !== fullCat.id
                                ? c
                                : {
                                    ...c,
                                    subcategories: c.subcategories.map((s) =>
                                      s.id !== fullSub.id
                                        ? s
                                        : {
                                            ...s,
                                            products: s.products.map((p) =>
                                              p.id === productId ? { ...p, name } : p,
                                            ),
                                          },
                                    ),
                                  },
                            ),
                          }
                        })
                      }}
                      onChangePrice={(productId, price) => {
                        setDraft((d) => {
                          if (!d) return d
                          return {
                            categories: d.categories.map((c) =>
                              c.id !== fullCat.id
                                ? c
                                : {
                                    ...c,
                                    subcategories: c.subcategories.map((s) =>
                                      s.id !== fullSub.id
                                        ? s
                                        : {
                                            ...s,
                                            products: s.products.map((p) =>
                                              p.id === productId ? { ...p, price } : p,
                                            ),
                                          },
                                    ),
                                  },
                            ),
                          }
                        })
                      }}
                    />
                  ) : (
                    <ProductList
                      products={fullSub.products}
                      busy={busy}
                      onUpload={uploadProductImage}
                      onEditDetails={openDetailsEditor}
                      onToggle={toggleActive}
                      onDelete={deleteProduct}
                    />
                  )}
                </div>
              )
            })}
          </section>
        )
      })}

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
    </div>
  )
}

function BulkEditProductList({
  products,
  busy,
  onChangeName,
  onChangePrice,
}: {
  products: { id: string; name: string; price: string }[]
  busy: boolean
  onChangeName: (id: string, name: string) => void
  onChangePrice: (id: string, price: string) => void
}) {
  if (products.length === 0) return null
  return (
    <ul className="space-y-2">
      {products.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 p-2"
        >
          <input
            className="input min-w-[8rem] flex-1 text-sm"
            value={p.name}
            disabled={busy}
            onChange={(e) => onChangeName(p.id, e.target.value)}
            aria-label="Nombre del producto"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500">$</span>
            <input
              className="input w-28 text-sm"
              inputMode="decimal"
              value={p.price}
              disabled={busy}
              onChange={(e) => onChangePrice(p.id, e.target.value)}
              aria-label="Precio del producto"
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ProductList({
  products,
  busy,
  onUpload,
  onEditDetails,
  onToggle,
  onDelete,
}: {
  products: CategoryRow['subcategories'][0]['products']
  busy: boolean
  onUpload: (id: string, f: File | null) => void
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
            className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2"
          >
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="h-12 w-12 rounded object-cover" />
            ) : (
              <div className="h-12 w-12 rounded bg-zinc-800" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`font-medium text-sm ${!p.active ? 'line-through text-zinc-500' : ''}`}>
                {p.name}
              </p>
              <p className="text-xs text-zinc-400">
                {formatMoneyArs(Number(p.price))} · Stock {p.stock_quantity}
              </p>
            </div>
            <label className="text-xs text-brand-accent cursor-pointer">
              Foto
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
              className="text-xs"
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
          </li>
        )
      })}
    </ul>
  )
}
