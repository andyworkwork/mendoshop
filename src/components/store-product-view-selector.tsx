'use client'

import { CategoryIcon } from '@/lib/category-icons'

export type ProductViewMode = 'category' | 'price_asc' | 'price_desc'

const OPTIONS: {
  id: ProductViewMode
  label: string
  short: string
}[] = [
  { id: 'category', label: 'Por categorías', short: 'Categorías' },
  { id: 'price_asc', label: 'Menor a mayor', short: '↑ Precio' },
  { id: 'price_desc', label: 'Mayor a menor', short: '↓ Precio' },
]

export function StoreProductViewSelector({
  value,
  onChange,
  categoryIcon,
}: {
  value: ProductViewMode
  onChange: (mode: ProductViewMode) => void
  categoryIcon: string | null | undefined
}) {
  return (
    <div className="store-view-mode mb-3">
      <p className="store-view-mode__label mb-2 text-xs font-medium text-zinc-500">Ordenar productos</p>
      <div className="store-view-mode__segments" role="group" aria-label="Ordenar productos">
        {OPTIONS.map((opt) => {
          const active = value === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.id)}
              className={`store-view-mode__segment ${active ? 'store-view-mode__segment--active' : ''}`}
            >
              {opt.id === 'category' ? (
                <CategoryIcon icon={categoryIcon} themeColor="product-frame" className="h-4 w-4 shrink-0" />
              ) : (
                <SortPriceIcon ascending={opt.id === 'price_asc'} className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">{opt.short}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SortPriceIcon({ ascending, className }: { ascending: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" d="M4 6h10M4 12h7M4 18h4" />
      {ascending ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 9v10M16 9l2 2M16 9l-2 2" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 19V9M16 19l2-2M16 19l-2-2" />
      )}
    </svg>
  )
}
