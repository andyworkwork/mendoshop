'use client'

import { THEME_TEMPLATES } from '@/lib/themes'
import type { ShopTheme } from '@/types/shop'

export function ThemePicker({
  value,
  onChange,
}: {
  value: ShopTheme
  onChange: (t: ShopTheme) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">Elegí una plantilla y los colores de tu vitrina.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange({ ...tpl.defaults })}
            className={`rounded-xl border p-3 text-left transition ${
              value.templateId === tpl.id
                ? 'border-teal-500 ring-2 ring-teal-500/30'
                : 'border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <div className="mb-2 flex gap-2">
              <span
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: tpl.defaults.primary }}
              />
              <span
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: tpl.defaults.accent }}
              />
            </div>
            <p className="font-medium">{tpl.name}</p>
            <p className="text-xs text-zinc-500">{tpl.description}</p>
          </button>
        ))}
      </div>
      <label className="block text-sm">
        Color principal
        <input
          type="color"
          className="mt-1 h-10 w-full cursor-pointer rounded border border-zinc-700 bg-transparent"
          value={value.primary}
          onChange={(e) => onChange({ ...value, primary: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Color de acento
        <input
          type="color"
          className="mt-1 h-10 w-full cursor-pointer rounded border border-zinc-700 bg-transparent"
          value={value.accent}
          onChange={(e) => onChange({ ...value, accent: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Fondo
        <select
          className="input mt-1"
          value={value.background}
          onChange={(e) =>
            onChange({
              ...value,
              background: e.target.value as ShopTheme['background'],
            })
          }
        >
          <option value="gradient">Degradado</option>
          <option value="solid">Sólido oscuro</option>
          <option value="pattern">Patrón</option>
        </select>
      </label>
    </div>
  )
}
