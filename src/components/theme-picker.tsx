'use client'

import Image from 'next/image'
import { SettingsCollapsible } from '@/components/settings-collapsible'
import { ThemeColorField } from '@/components/theme-color-field'
import {
  backgroundPreviewStyle,
  patchBackgroundColor,
  resolveBackgroundColors,
  resolveProductFrameColor,
  resolveTitleColor,
  themeCssVars,
  THEME_TEMPLATES,
  VITRINA_BACKGROUND_OPTIONS,
} from '@/lib/themes'
import type { ShopBackgroundColors, ShopTheme } from '@/types/shop'

function templateLabel(templateId: string): string {
  return THEME_TEMPLATES.find((t) => t.id === templateId)?.name ?? templateId
}

function templateSwatches(defaults: ShopTheme) {
  return [
    { title: 'Principal (botones)', color: defaults.primary },
    { title: 'Detalle (nombre y precios)', color: defaults.accent },
    { title: 'Producto (fondo tarjeta)', color: defaults.productFrame ?? '#f4f4f5' },
    {
      title: 'Títulos',
      color: defaults.titleColor ?? defaults.productFrame ?? '#71717a',
    },
  ]
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
      <ThemeColorField label="Color de fondo" value={colors.light} onChange={(c) => onPatch('light', c)} />
    )
  }
  if (background === 'solid') {
    return (
      <ThemeColorField label="Color de fondo" value={colors.solid} onChange={(c) => onPatch('solid', c)} />
    )
  }
  if (background === 'gradient') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <ThemeColorField
          label="Brillo superior"
          value={colors.gradientTop}
          onChange={(c) => onPatch('gradientTop', c)}
        />
        <ThemeColorField
          label="Color base inferior"
          value={colors.gradientBottom}
          onChange={(c) => onPatch('gradientBottom', c)}
        />
      </div>
    )
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ThemeColorField
        label="Fondo del patrón"
        value={colors.patternBase}
        onChange={(c) => onPatch('patternBase', c)}
      />
      <ThemeColorField label="Color de los puntos" value={colors.patternDot} onChange={(c) => onPatch('patternDot', c)} />
    </div>
  )
}

export function ThemePicker({
  value,
  onChange,
  templatesDefaultOpen = false,
}: {
  value: ShopTheme
  onChange: (t: ShopTheme) => void
  /** Primera visita: plantillas desplegadas para elegir rubro. */
  templatesDefaultOpen?: boolean
}) {
  const previewStyle = themeCssVars(value)
  const bgColors = resolveBackgroundColors(value)
  const selectedName = templateLabel(value.templateId)
  const productFrame = resolveProductFrameColor(value)
  const titleColor = resolveTitleColor(value)

  const patchBg = (key: keyof ShopBackgroundColors, color: string) => {
    onChange(patchBackgroundColor(value, key, color))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Elige tu plantilla y luego personalizalá como quieras!
      </p>

      <SettingsCollapsible
        title="Plantillas por rubro"
        subtitle={selectedName}
        defaultOpen={templatesDefaultOpen}
      >
        <div className="grid max-h-[360px] gap-3 overflow-y-auto sm:grid-cols-2">
          {THEME_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() =>
                onChange({
                  ...tpl.defaults,
                  productFrame: tpl.defaults.productFrame ?? '#ffffff',
                  titleColor: tpl.defaults.titleColor ?? tpl.defaults.productFrame ?? '#3f3f46',
                })
              }
              className={`overflow-hidden rounded-xl border text-left transition ${
                value.templateId === tpl.id
                  ? 'border-brand ring-2 ring-brand'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {tpl.bannerSrc ? (
                tpl.id === 'minimal' ? (
                  <div className="flex aspect-[21/9] w-full items-center justify-center bg-zinc-900 p-4">
                    <Image
                      src={tpl.bannerSrc}
                      alt=""
                      width={180}
                      height={54}
                      className="h-12 w-auto max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-[21/9] w-full bg-zinc-800">
                    <Image
                      src={tpl.bannerSrc}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                  </div>
                )
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
                  {templateSwatches(tpl.defaults).map((sw) => (
                    <span
                      key={sw.title}
                      className="h-6 w-6 rounded-full border border-zinc-600"
                      title={sw.title}
                      style={{ backgroundColor: sw.color }}
                    />
                  ))}
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
          Elegí un estilo y personalizá sus colores. Al cambiar de plantilla se usa el banner del rubro (podés subir el tuyo después).
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

      <ThemeColorField
        label="Color principal (botones)"
        value={value.primary}
        onChange={(primary) => onChange({ ...value, primary })}
      />
      <ThemeColorField
        label="Color detalle (nombre, precios y detalles)"
        value={value.accent}
        onChange={(accent) => onChange({ ...value, accent })}
      />
      <ThemeColorField
        label="Color producto (fondo y borde de tarjeta)"
        value={productFrame}
        onChange={(productFrame) => onChange({ ...value, productFrame })}
        fallback={value.background === 'light' ? '#f4f4f5' : '#27272a'}
      />
      <ThemeColorField
        label="Color título (tagline, secciones, categorías, ordenar)"
        value={titleColor}
        onChange={(titleColor) => onChange({ ...value, titleColor })}
        fallback={productFrame}
      />
      <p className="text-xs text-zinc-500">
        Principal → botones · Detalle → nombre y precio · Producto → fondo del recuadro de cada producto · Título →
        textos de sección, nombres de categoría e iconos (café, celular, etc.) en la vitrina.
      </p>
    </div>
  )
}
