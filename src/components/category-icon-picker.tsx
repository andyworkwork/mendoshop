'use client'

import { CATEGORY_ICON_OPTIONS, CategoryIcon } from '@/lib/category-icons'

export function CategoryIconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string | null | undefined
  onChange: (icon: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Icono de categoría">
      {CATEGORY_ICON_OPTIONS.map((opt) => {
        const selected = (value ?? 'tag') === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            title={opt.label}
            onClick={() => onChange(opt.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              selected
                ? 'border-brand bg-brand/15 text-brand'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            <CategoryIcon icon={opt.id} className="h-5 w-5" />
          </button>
        )
      })}
    </div>
  )
}
