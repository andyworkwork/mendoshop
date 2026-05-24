import Image from 'next/image'
import { formatMoneyArs } from '@/lib/format'
import type { ResolvedTemplateShowcase } from '@/lib/template-showcase-data'
import { resolveTemplateShowcase } from '@/lib/template-showcase-data'
import type { StoreTemplate } from '@/lib/store-templates'
import {
  resolveAccentColor,
  resolveProductFrameColor,
  shopBackgroundClass,
  themeCssVars,
} from '@/lib/themes'
import type { ShopTheme } from '@/types/shop'

const LOGO_SRC = '/mendoshop-logo.png'

export function TemplateShowcasePreview({
  template,
  showcase,
  theme: themeOverride,
  caption,
}: {
  template: StoreTemplate
  showcase?: ResolvedTemplateShowcase
  /** Tema de una tienda real; si no, usa el de la plantilla. */
  theme?: ShopTheme
  /** Texto bajo el teléfono (nombre de tienda o rubro). */
  caption?: string
}) {
  const data = showcase ?? resolveTemplateShowcase(template, null)
  const theme = themeOverride ?? template.defaults
  const isLight = theme.background === 'light'
  const accent = resolveAccentColor(theme)
  const frame = resolveProductFrameColor(theme)

  return (
    <div className="template-showcase-phone" aria-hidden>
      <div
        className={`template-showcase-screen ${shopBackgroundClass(theme)}`}
        style={themeCssVars(theme)}
      >
        <div
          className={`template-showcase-topbar ${isLight ? 'bg-white/95 border-zinc-200' : 'border-zinc-800 bg-zinc-950/90'}`}
        >
          <span className="template-showcase-menu" />
          <span className="template-showcase-brand">
            <Image src={LOGO_SRC} alt="" width={18} height={18} className="rounded-sm object-cover" />
            <span>
              <span className="text-brand">Mendo</span>
              <span className={isLight ? 'text-zinc-900' : 'text-white'}>shop</span>
            </span>
          </span>
          <span className="template-showcase-cart btn-primary" />
        </div>

        <div
          className="template-showcase-banner"
          style={{ backgroundImage: `url(${data.bannerUrl})` }}
        >
          <div className="template-showcase-banner-badge">
            <span className="store-vitrina-title-text text-[10px] font-bold uppercase tracking-wide">
              {data.shopName}
            </span>
          </div>
        </div>

        <p className="template-showcase-tagline store-vitrina-title-text">{data.tagline}</p>

        <p className="template-showcase-section store-vitrina-title-text">Productos destacados</p>

        <ul className="template-showcase-products">
          {data.products.map((p) => (
            <li
              key={p.name}
              className="template-showcase-product"
              style={{ backgroundColor: frame, borderColor: `${accent}33` }}
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="template-showcase-product-img object-cover" />
              ) : (
                <div className="template-showcase-product-img bg-zinc-300/40" />
              )}
              <p className="line-clamp-2 text-[9px] font-medium leading-tight" style={{ color: accent }}>
                {p.name}
              </p>
              <p className="text-[10px] font-bold" style={{ color: accent }}>
                {formatMoneyArs(p.price)}
              </p>
              <span className="template-showcase-add btn-primary text-[8px]">+ carrito</span>
            </li>
          ))}
        </ul>

        <div className="template-showcase-wa">WhatsApp</div>
      </div>
      <p className="template-showcase-label">{caption ?? template.name}</p>
    </div>
  )
}
