'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatMoneyArs } from '@/lib/format'
import {
  flattenCatalogProducts,
  maxFeaturedProductsForPlan,
  planHasFeaturedCarousel,
  sanitizeFeaturedProductIds,
} from '@/lib/featured-products'
import { getProductImageUrl } from '@/lib/product-images'
import type { CategoryRow } from '@/types/catalog'
import type { ShopPlan } from '@/types/shop'

export function FeaturedProductsPicker({
  categories,
  selectedIds,
  onChange,
  disabled,
  plan,
}: {
  categories: CategoryRow[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  plan: ShopPlan
}) {
  const maxFeatured = maxFeaturedProductsForPlan(plan)
  const hasCarousel = planHasFeaturedCarousel(plan)
  const [hint, setHint] = useState<string | null>(null)
  const products = useMemo(() => {
    return flattenCatalogProducts(categories)
      .filter((p) => p.active)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [categories])

  const validSelectedIds = useMemo(
    () => sanitizeFeaturedProductIds(selectedIds, products, { max: maxFeatured }),
    [selectedIds, products, maxFeatured],
  )

  const staleCount = selectedIds.length - validSelectedIds.length

  useEffect(() => {
    if (staleCount > 0) {
      onChange(validSelectedIds)
    }
  }, [staleCount, validSelectedIds, onChange])

  function toggle(id: string) {
    setHint(null)
    if (validSelectedIds.includes(id)) {
      onChange(validSelectedIds.filter((x) => x !== id))
      return
    }
    if (validSelectedIds.length >= maxFeatured) {
      setHint(`Solo podés elegir ${maxFeatured} productos destacados. Desmarcá uno para cambiar.`)
      return
    }
    onChange([...validSelectedIds, id])
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        No hay productos activos. Creá productos en{' '}
        <span className="text-brand-accent">Catálogo</span> y volvé acá.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        Elegí hasta {maxFeatured} productos para la sección &quot;Productos destacados&quot; en tu tienda
        {hasCarousel ? ' (carrusel rotativo en plan Pro)' : ''}. ({validSelectedIds.length}/{maxFeatured}{' '}
        seleccionados)
      </p>
      {staleCount > 0 && (
        <p className="text-sm text-amber-400">
          Se quitaron {staleCount} destacado{staleCount === 1 ? '' : 's'} porque el producto ya no existe.
        </p>
      )}
      {hint && <p className="text-sm text-amber-400">{hint}</p>}
      <ul className="max-h-[min(50vh,360px)] space-y-2 overflow-y-auto pr-1">
        {products.map((p) => {
          const checked = validSelectedIds.includes(p.id)
          const slot = checked ? validSelectedIds.indexOf(p.id) + 1 : null
          const img = getProductImageUrl(p.image_path, 'thumb')
          return (
            <li key={p.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${
                  checked
                    ? 'border-brand bg-brand/10'
                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500'
                } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(p.id)}
                />
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                    checked
                      ? 'border-brand bg-brand text-white shadow-[0_0_0_2px_rgba(255,255,255,0.08)_inset]'
                      : 'border-zinc-600 bg-zinc-900 text-transparent'
                  }`}
                  aria-hidden
                >
                  {checked ? '✓' : slot ?? '·'}
                </span>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-800" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-zinc-100">{p.name}</span>
                  <span className="text-xs text-zinc-500">{formatMoneyArs(p.price)}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
