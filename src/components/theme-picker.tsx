'use client'

import Image from 'next/image'
import { SettingsCollapsible } from '@/components/settings-collapsible'
import {
  backgroundPreviewStyle,
  patchBackgroundColor,
  resolveBackgroundColors,
  themeCssVars,
  THEME_TEMPLATES,
  VITRINA_BACKGROUND_OPTIONS,
} from '@/lib/themes'
import type { ShopBackgroundColors, ShopTheme } from '@/types/shop'

function templateLabel(templateId: string): string {
  return THEME_TEMPLATES.find((t) => t.id === templateId)?.name ?? templateId
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        type="color"
        className="mt-1 h-10 w-full cursor-pointer rounded border border-zinc-700 bg-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function BackgroundColorFields({
  background,
  colors,
  onPatch,
}: {
  background: ShopTheme['background']
  colors: ShopBackgroundColors
  onPatch: (key: keyof ShopBackgroundColors, color: string) => void
}) {
  if (background === 'light') {
    return (
      <ColorField label="Color de fondo" value={colors.light} onChange={(c) => onPatch('light', c)} />
    )
  }
  if (background === 'solid') {
    return (
      <ColorField label="Color de fondo" value={colors.solid} onChange={(c) => onPatch('solid', c)} />
    )
  }
  if (background === 'gradient') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <ColorField
          label="Brillo superior"
          value={colors.gradientTop}
          onChange={(c) => onPatch('gradientTop', c)}
        />
        <ColorField
          label="Color base inferior"
          value={colors.gradientBottom}
          onChange={(c) => onPatch('gradientBottom', c)}
        />
      </div>
    )
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ColorField
        label="Fondo del patrón"
        value={colors.patternBase}
        onChange={(c) => onPatch('patternBase', c)}
      />
      <ColorField label="Color de los puntos" value={colors.patternDot} onChange={(c) => onPatch('patternDot', c)} />
    </div>
  )
}

export function ThemePicker({
  value,
  onChange,
}: {
  value: ShopTheme
  onChange: (t: ShopTheme) => void
}) {
  const previewStyle = themeCssVars(value)
  const bgColors = resolveBackgroundColors(value)
  const selectedName = templateLabel(value.templateId)

  const patchBg = (key: keyof ShopBackgroundColors, color: string) => {
    onChange(patchBackgroundColor(value, key, color))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Elegí una plantilla por rubro (colores sugeridos y banner de ejemplo si no subiste el tuyo). Podés
        cambiar fondo y colores cuando quieras.
      </p>

      <SettingsCollapsible title="Plantillas por rubro" subtitle={selectedName} defaultOpen={false}>
        <div className="grid max-h-[360px] gap-3 overflow-y-auto sm:grid-cols-2">
          {THEME_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() =>
                onChange({
                  ...tpl.defaults,
                  productFrame: tpl.defaults.productFrame ?? '#ffffff',
                  background: value.background,
                  backgroundColors: value.backgroundColors,
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
                <div className="mb-2 flex flex-wrap gap-2">
                  <span
                    className="h-6 w-6 rounded-full border border-zinc-600"
                    title="Principal (botones)"
                    style={{ backgroundColor: tpl.defaults.primary }}
                  />
                  <span
                    className="h-6 w-6 rounded-full border border-zinc-600"
                    title="Acento (nombre y precios)"
                    style={{ backgroundColor: tpl.defaults.accent }}
                  />
                  <span
                    className="h-6 w-6 rounded-full border border-zinc-600"
                    title="Tarjeta de producto (fondo)"
                    style={{
                      backgroundColor: tpl.defaults.productFrame ?? '#f4f4f5',
                    }}
                  />
                </div>
                <p className="font-medium">{tpl.name}</p>
                <p className="text-xs text-zinc-500">{tpl.description}</p>
              </div>
            </button>
          ))}
        </div>
      </SettingsCollapsible>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-200">Fondo de la tienda</p>
        <p className="mb-3 text-xs text-zinc-500">
          Elegí un estilo y personalizá sus colores. No cambia la imagen del banner.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                  className="mb-2 h-14 w-full rounded-lg"
                  style={backgroundPreviewStyle(opt.id, bgColors)}
                  aria-hidden
                />
                <p className="text-xs font-semibold text-zinc-100">{opt.label}</p>
                <p className="text-[10px] leading-tight text-zinc-500">{opt.hint}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3" style={previewStyle}>
          <p className="mb-3 text-xs font-medium text-zinc-400">Colores del fondo seleccionado</p>
          <BackgroundColorFields background={value.background} colors={bgColors} onPatch={patchBg} />
        </div>
      </div>

      <label className="block text-sm">
        Color principal (botones)
        <input
          type="color"
          className="mt-1 h-10 w-full cursor-pointer rounded border border-zinc-700 bg-transparent"
          value={value.primary}
          onChange={(e) => onChange({ ...value, primary: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Color de acento (nombre, precios y detalles)
        <input
          type="color"
          className="mt-1 h-10 w-full cursor-pointer rounded border border-zinc-700 bg-transparent"
          value={value.accent}
          onChange={(e) => onChange({ ...value, accent: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Tarjeta de producto (fondo y borde)
        <input
          type="color"
          className="mt-1 h-10 w-full cursor-pointer rounded border border-zinc-700 bg-transparent"
          value={value.productFrame ?? (value.background === 'light' ? '#f4f4f5' : '#27272a')}
          onChange={(e) => onChange({ ...value, productFrame: e.target.value })}
        />
      </label>
      <p className="text-xs text-zinc-500">
        Principal → botones · Acento → nombre y precio del producto · Tarjeta de producto → fondo del recuadro,
        títulos de sección, categorías e iconos en la vitrina. Al elegir plantilla, el acento se ajusta si no contrasta
        con el fondo de tarjeta.
      </p>
    </div>
  )
}
