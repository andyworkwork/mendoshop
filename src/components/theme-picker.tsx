'use client'

import Image from 'next/image'
import { themeCssVars, THEME_TEMPLATES, VITRINA_BACKGROUND_OPTIONS } from '@/lib/themes'
import type { ShopTheme } from '@/types/shop'

export function ThemePicker({
  value,
  onChange,
}: {
  value: ShopTheme
  onChange: (t: ShopTheme) => void
}) {
  const previewStyle = themeCssVars(value)

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400">
        Elegí una plantilla por rubro (imagen y colores sugeridos). Podés cambiar fondo y colores
        cuando quieras.
      </p>

      <div className="grid max-h-[360px] gap-3 overflow-y-auto sm:grid-cols-2">
        {THEME_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() =>
              onChange({
                ...tpl.defaults,
                background: value.background,
              })
            }
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

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Fondo de la vitrina</p>
        <p className="mb-3 text-xs text-zinc-500">
          Es el color de fondo detrás de los productos (no cambia la imagen del banner).
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" style={previewStyle}>
          {VITRINA_BACKGROUND_OPTIONS.map((opt) => {
            const selected = value.background === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...value, background: opt.id })}
                className={`rounded-xl border p-2 text-left transition ${
                  selected
                    ? 'border-brand ring-2 ring-brand'
                    : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <div
                  className={`mb-2 h-14 w-full rounded-lg ${opt.previewClass}`}
                  aria-hidden
                />
                <p className="text-xs font-semibold text-zinc-100">{opt.label}</p>
                <p className="text-[10px] leading-tight text-zinc-500">{opt.hint}</p>
              </button>
            )
          })}
        </div>
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
    </div>
  )
}
