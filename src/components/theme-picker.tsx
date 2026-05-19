'use client'

import Image from 'next/image'
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
      <p className="text-sm text-zinc-400">
        Elegí una plantilla por rubro (imagen y colores sugeridos). Podés personalizar todo después.
      </p>
      <div className="grid max-h-[420px] gap-3 overflow-y-auto sm:grid-cols-2">
        {THEME_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onChange({ ...tpl.defaults })}
            className={`overflow-hidden rounded-xl border text-left transition ${
              value.templateId === tpl.id
                ? 'border-brand ring-2 ring-brand'
                : 'border-zinc-700 hover:border-zinc-500'
            }`}
          >
            {tpl.bannerSrc ? (
              <div className="relative aspect-[21/9] w-full bg-zinc-800">
                <Image
                  src={tpl.bannerSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 200px"
                />
              </div>
            ) : (
              <div
                className="aspect-[21/9] w-full"
                style={{
                  background: `linear-gradient(135deg, ${tpl.defaults.primary}, ${tpl.defaults.accent})`,
                }}
              />
            )}
            <div className="p-3">
              <div className="mb-2 flex gap-2">
                <span
                  className="h-6 w-6 rounded-full border border-zinc-600"
                  style={{ backgroundColor: tpl.defaults.primary }}
                />
                <span
                  className="h-6 w-6 rounded-full border border-zinc-600"
                  style={{ backgroundColor: tpl.defaults.accent }}
                />
              </div>
              <p className="font-medium">{tpl.name}</p>
              <p className="text-xs text-zinc-500">{tpl.description}</p>
            </div>
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
        Fondo de la vitrina
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
          <option value="light">Claro (recomendado)</option>
          <option value="gradient">Degradado oscuro</option>
          <option value="solid">Sólido oscuro</option>
          <option value="pattern">Patrón</option>
        </select>
      </label>
    </div>
  )
}
