import type { Metadata } from 'next'
import type { ShopRow } from '@/types/shop'
import { appBaseUrl, getPublicUrlFromPath, shopPublicUrl } from '@/lib/publicUrl'

/**
 * SEO = cómo Google y WhatsApp muestran tu link al compartirlo.
 * title = título de la pestaña; description = texto bajo el link; openGraph = vista previa con imagen.
 */
export function shopMetadata(shop: ShopRow): Metadata {
  const title = shop.seo_title?.trim() || `${shop.name} | Mendoshop`
  const description =
    shop.seo_description?.trim() ||
    shop.description?.trim() ||
    `Catálogo de ${shop.name} en Mendoshop. Pedí por WhatsApp.`

  const url = shopPublicUrl(shop.slug)
  const image = getPublicUrlFromPath(shop.banner_path) ?? getPublicUrlFromPath(shop.logo_path)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Mendoshop',
      locale: 'es_AR',
      type: 'website',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: shop.name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: { canonical: url },
  }
}

export const SITE_METADATA: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: 'Mendoshop',
  description:
    'Creá tu tienda online en minutos. Catálogo, fotos optimizadas, plantillas y pedidos por WhatsApp.',
  openGraph: {
    title: 'Mendoshop',
    description: 'Vitrinas para emprendedores de Mendoza',
    locale: 'es_AR',
    type: 'website',
    images: [{ url: '/mendoshop-logo.png', width: 512, height: 512, alt: 'Mendoshop' }],
  },
}
