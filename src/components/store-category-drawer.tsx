'use client'

import type { CategoryRow } from '@/types/catalog'

type Props = {
  open: boolean
  onClose: () => void
  categories: CategoryRow[]
}

export function StoreCategoryDrawer({ open, onClose, categories }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" className="flex-1 bg-black/40" aria-label="Cerrar menú" onClick={onClose} />
      <aside className="flex h-full w-[min(100%,280px)] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <p className="font-semibold text-zinc-900">Categorías</p>
          <button type="button" className="text-sm text-zinc-500" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {categories.length === 0 && (
            <p className="text-sm text-zinc-500">Sin categorías aún.</p>
          )}
          {categories.map((cat) => (
            <p
              key={cat.id}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-800"
            >
              {cat.name}
            </p>
          ))}
        </nav>
      </aside>
    </div>
  )
}
