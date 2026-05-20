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
import type { CategoryRow } from '@/types/catalog'
import type { ShopRow } from '@/types/shop'

export function CatalogEditor({
  shop,
  initial,
}: {
  shop: ShopRow
  initial: CategoryRow[]
}) {
  const [categories, setCategories] = useState(initial)
  const [busy, setBusy] = useState(false)
  const sb = createClient()
  const limits = PLAN_LIMITS[shop.plan]
  const productCount = countProducts(categories)

  const refresh = useCallback(async () => {
    const [catRes, subRes, ssRes, prodRes] = await Promise.all([
      sb.from('categories').select('id, name, sort_order').eq('shop_id', shop.id).order('sort_order'),
      sb.from('subcategories').select('id, category_id, name, sort_order').eq('shop_id', shop.id),
      sb.from('subsubcategorias').select('id, subcategory_id, name, sort_order').eq('shop_id', shop.id),
      sb
        .from('products')
        .select(
          'id, subcategory_id, subsubcategoria_id, name, description, price, stock_quantity, image_path, image_gallery, active, sort_order',
        )
        .eq('shop_id', shop.id),
    ])
    const { fetchCategoriesWithNested } = await import('@/lib/fetch-catalog')
    const tree = await fetchCategoriesWithNested(sb, shop.id, { includeInactive: true })
    setCategories(tree)
    void catRes
    void subRes
    void ssRes
    void prodRes
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
    await sb.from('categories').insert({ shop_id: shop.id, name: name.trim(), sort_order: sort })
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

  async function addSubsub(subcategoryId: string) {
    const name = prompt('Nombre de la sub-subcategoría')
    if (!name?.trim()) return
    setBusy(true)
    await sb.from('subsubcategorias').insert({
      shop_id: shop.id,
      subcategory_id: subcategoryId,
      name: name.trim(),
      sort_order: 0,
    })
    setBusy(false)
    await publishCatalog()
  }

  async function addProduct(subcategoryId: string, subsubId: string | null) {
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
      subsubcategoria_id: subsubId,
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
        cacheControl: '86400',
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

      {categories.length === 0 && (
        <p className="text-zinc-500">Empezá creando una categoría (ej. Ropa, Accesorios, Comida).</p>
      )}

      {categories.map((cat) => (
        <section key={cat.id} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-brand">{cat.name}</h2>
            <button
              type="button"
              disabled={busy}
              className="text-sm text-brand-accent"
              onClick={() => addSubcategory(cat.id)}
            >
              + Subcategoría
            </button>
          </div>
          {cat.subcategories.map((sub) => (
            <div key={sub.id} className="ml-2 border-l border-zinc-700 pl-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{sub.name}</h3>
                <button
                  type="button"
                  className="text-xs text-zinc-400"
                  onClick={() => addSubsub(sub.id)}
                >
                  + Sub-sub
                </button>
                <button
                  type="button"
                  className="text-xs text-brand-accent"
                  onClick={() => addProduct(sub.id, null)}
                >
                  + Producto
                </button>
              </div>
              <ProductList
                products={sub.products}
                busy={busy}
                onUpload={uploadProductImage}
                onToggle={toggleActive}
                onDelete={deleteProduct}
              />
              {sub.subsubcategorias.map((ss) => (
                <div key={ss.id} className="ml-2 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-zinc-400">{ss.name}</span>
                    <button
                      type="button"
                      className="text-xs text-brand-accent"
                      onClick={() => addProduct(sub.id, ss.id)}
                    >
                      + Producto
                    </button>
                  </div>
                  <ProductList
                    products={ss.products}
                    busy={busy}
                    onUpload={uploadProductImage}
                    onToggle={toggleActive}
                    onDelete={deleteProduct}
                  />
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

function ProductList({
  products,
  busy,
  onUpload,
  onToggle,
  onDelete,
}: {
  products: CategoryRow['subcategories'][0]['products']
  busy: boolean
  onUpload: (id: string, f: File | null) => void
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

