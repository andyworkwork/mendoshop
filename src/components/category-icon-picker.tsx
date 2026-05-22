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
                ? 'border-2 border-[var(--brand-orange)] bg-brand/20 text-brand shadow-[0_0_0_1px_var(--brand-orange),0_0_10px_color-mix(in_srgb,var(--brand-orange)_45%,transparent)] ring-2 ring-white/30 ring-offset-1 ring-offset-zinc-900'
                : 'border border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            <CategoryIcon icon={opt.id} className="h-5 w-5" />
          </button>
        )
      })}
    </div>
  )
}
