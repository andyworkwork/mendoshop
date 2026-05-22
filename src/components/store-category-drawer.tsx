'use client'

import type { CSSProperties } from 'react'
import { CategoryIcon } from '@/lib/category-icons'
import type { CategoryRow } from '@/types/catalog'

type Props = {
  open: boolean
  onClose: () => void
  categories: CategoryRow[]
  themeStyle: CSSProperties
  onSelectCategory: (categoryId: string) => void
}

export function StoreCategoryDrawer({
  open,
  onClose,
  categories,
  themeStyle,
  onSelectCategory,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex" style={themeStyle}>
      <button type="button" className="flex-1 bg-black/40" aria-label="Cerrar menú" onClick={onClose} />
      <aside className="store-drawer-panel flex h-full w-[min(100%,280px)] flex-col shadow-xl">
        <div className="store-drawer-header flex items-center justify-between px-4 py-3">
          <p className="font-semibold">Categorías</p>
          <button type="button" className="store-drawer-close text-sm" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <nav className="scrollbar-none flex-1 overflow-y-auto p-3">
          {categories.length === 0 && (
            <p className="text-sm text-zinc-500">Sin categorías aún.</p>
          )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="store-drawer-cat-btn mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium"
            >
              <CategoryIcon icon={cat.icon} themeColor="title" className="h-5 w-5 shrink-0 opacity-90" />
              {cat.name}
            </button>
          ))}
        </nav>
      </aside>
    </div>
  )
}
