'use client'

import { useMemo, useState } from 'react'
import { formatMoneyArs } from '@/lib/format'
import {
  flattenCatalogProducts,
  MAX_FEATURED_PRODUCTS,
} from '@/lib/featured-products'
import { getProductImageUrl } from '@/lib/product-images'
import type { CategoryRow } from '@/types/catalog'

export function FeaturedProductsPicker({
  categories,
  selectedIds,
  onChange,
  disabled,
}: {
  categories: CategoryRow[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}) {
  const [hint, setHint] = useState<string | null>(null)
  const products = useMemo(() => {
    return flattenCatalogProducts(categories)
      .filter((p) => p.active)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [categories])

  function toggle(id: string) {
    setHint(null)
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
      return
    }
    if (selectedIds.length >= MAX_FEATURED_PRODUCTS) {
      setHint(`Solo podés elegir ${MAX_FEATURED_PRODUCTS} productos destacados. Desmarcá uno para cambiar.`)
      return
    }
    onChange([...selectedIds, id])
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
        Elegí hasta {MAX_FEATURED_PRODUCTS} productos para la sección &quot;Productos destacados&quot; en tu
        tienda. ({selectedIds.length}/{MAX_FEATURED_PRODUCTS} seleccionados)
      </p>
      {hint && <p className="text-sm text-amber-400">{hint}</p>}
      <ul className="max-h-[min(50vh,360px)] space-y-2 overflow-y-auto pr-1">
        {products.map((p) => {
          const checked = selectedIds.includes(p.id)
          const slot = checked ? selectedIds.indexOf(p.id) + 1 : null
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
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    checked
                      ? 'border-brand bg-brand text-[var(--brand-ink)]'
                      : 'border-zinc-600 text-transparent'
                  }`}
                  aria-hidden
                >
                  {slot ?? '·'}
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
