import type { Metadata } from 'next'
import { appBaseUrl } from '@/lib/app-url'
import { PLAN_LIMITS } from '@/lib/plans'

export const PROMO_HERO_SHOWCASE = [
  { src: '/hero-carousel/ropa.webp', label: 'Indumentaria' },
  { src: '/hero-carousel/bijuteria.webp', label: 'Accesorios' },
  { src: '/hero-carousel/manicura.webp', label: 'Belleza' },
  { src: '/hero-carousel/alimento-de-mascota.webp', label: 'Mascotas' },
  { src: '/hero-carousel/accesorios-de-celular.webp', label: 'Tecnología' },
  { src: '/hero-carousel/plantas.webp', label: 'Plantas' },
] as const

export const PROMO_TRUST_POINTS = [
  '7 días gratis',
  'Sin tarjeta',
  'Pedidos por WhatsApp',
  `${PLAN_LIMITS.free_trial.maxProducts} productos en la prueba`,
] as const

/** Testimonios de ejemplo para la landing promocional. */
export const PROMO_TESTIMONIALS = [
  {
    name: 'Camila R.',
    rubro: 'Indumentaria',
    city: 'Mendoza',
    quote:
      'Me gusta porque tiene varias cosas para personalizar mi propia tienda: colores, plantilla y categorías. En un rato ya tenía algo presentable.',
    rating: 4.5,
  },
  {
    name: 'Lucas M.',
    rubro: 'Accesorios de celular',
    city: 'Godoy Cruz',
    quote:
      'Antes mandaba fotos sueltas por WhatsApp. Ahora mando un link y el cliente elige solo. Se ve mucho más profesional.',
    rating: 4,
  },
  {
    name: 'Sofía T.',
    rubro: 'Manicura y belleza',
    city: 'Las Heras',
    quote:
      'La prueba de 7 días me alcanzó para cargar servicios y precios. Mis clientas entendieron al toque cómo pedir.',
    rating: 4.5,
  },
  {
    name: 'Diego P.',
    rubro: 'Alimentos para mascotas',
    city: 'Guaymallén',
    quote:
      'No soy de tecnología y lo pude armar yo. Subí fotos, puse categorías y listo. El pedido cae directo al WhatsApp.',
    rating: 4,
  },
  {
    name: 'Valentina L.',
    rubro: 'Plantas y jardinería',
    city: 'Mendoza',
    quote:
      'Lo mejor es que no necesité diseñador. Elegí una plantilla, cambié los colores y ya tenía mi vitrina para Instagram.',
    rating: 4.5,
  },
] as const

export const PROMO_FAQ = [
  {
    q: '¿Necesito tarjeta de crédito para empezar?',
    a: 'No. La prueba gratis no pide tarjeta. Solo email y los datos de tu tienda.',
  },
  {
    q: '¿Cuánto dura la prueba?',
    a: '7 días con catálogo, fotos y link para compartir. Ideal para cargar productos y probar antes de pagar.',
  },
  {
    q: '¿Qué pasa cuando termina la prueba?',
    a: 'Podés contratar plan Básico o Pro para seguir online, o escribirnos si tenés dudas.',
  },
  {
    q: '¿Sirve para mi rubro?',
    a: 'Sí. Mendoshop está pensado para cualquier emprendimiento que venda por WhatsApp: ropa, comida, servicios, ferretería y más.',
  },
  {
    q: '¿Puedo usar mi link en Instagram, TikTok y Facebook?',
    a: 'Sí. Compartís un solo link de tu tienda en bio, stories o publicaciones y los clientes ven tu catálogo ordenado.',
  },
] as const

export function promoLandingMetadata(): Metadata {
  const title = '7 días gratis — Creá tu tienda online | Mendoshop'
  const description =
    'Armá tu catálogo con fotos, categorías y pedidos por WhatsApp. Prueba gratis 7 días, sin tarjeta. Ideal para emprendedores de Mendoza.'
  const url = `${appBaseUrl()}/promo`

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
      images: [
        {
          url: '/mendoshop-hero-bg.png',
          width: 1200,
          height: 630,
          alt: 'Mendoshop — tienda online con pedidos por WhatsApp',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/mendoshop-hero-bg.png'],
    },
    alternates: { canonical: url },
  }
}
