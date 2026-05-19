import type { ShopTheme } from '@/types/shop'

export type StoreTemplate = {
  id: string
  name: string
  description: string
  bannerSrc: string
  carouselSrc: string
  defaults: ShopTheme
}

/** Plantillas por rubro (imágenes en public/store-templates y public/hero-carousel). */
export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: 'bijuteria',
    name: 'Bijutería',
    description: 'Joyas y accesorios',
    bannerSrc: '/store-templates/bijuteria.webp',
    carouselSrc: '/hero-carousel/bijuteria.webp',
    defaults: {
      templateId: 'bijuteria',
      primary: '#c9a227',
      accent: '#9333ea',
      background: 'light',
    },
  },
  {
    id: 'ropa',
    name: 'Ropa',
    description: 'Indumentaria y moda',
    bannerSrc: '/store-templates/ropa.webp',
    carouselSrc: '/hero-carousel/ropa.webp',
    defaults: {
      templateId: 'ropa',
      primary: '#1e3a5f',
      accent: '#ec4899',
      background: 'light',
    },
  },
  {
    id: 'plantas',
    name: 'Plantas',
    description: 'Verde y naturaleza',
    bannerSrc: '/store-templates/plantas.webp',
    carouselSrc: '/hero-carousel/plantas.webp',
    defaults: {
      templateId: 'plantas',
      primary: '#15803d',
      accent: '#ca8a04',
      background: 'light',
    },
  },
  {
    id: 'manicura',
    name: 'Manicura',
    description: 'Belleza y uñas',
    bannerSrc: '/store-templates/manicura.webp',
    carouselSrc: '/hero-carousel/manicura.webp',
    defaults: {
      templateId: 'manicura',
      primary: '#db2777',
      accent: '#f472b6',
      background: 'light',
    },
  },
  {
    id: 'mascotas',
    name: 'Mascotas',
    description: 'Todo para tu mascota',
    bannerSrc: '/store-templates/mascotas.webp',
    carouselSrc: '/hero-carousel/mascotas.webp',
    defaults: {
      templateId: 'mascotas',
      primary: '#ea580c',
      accent: '#2563eb',
      background: 'light',
    },
  },
  {
    id: 'alimento-de-mascota',
    name: 'Alimento de mascota',
    description: 'Alimentos y snacks',
    bannerSrc: '/store-templates/alimento-de-mascota.webp',
    carouselSrc: '/hero-carousel/alimento-de-mascota.webp',
    defaults: {
      templateId: 'alimento-de-mascota',
      primary: '#b45309',
      accent: '#16a34a',
      background: 'light',
    },
  },
  {
    id: 'accesorios-de-celular',
    name: 'Accesorios de celular',
    description: 'Fundas, cables y más',
    bannerSrc: '/store-templates/accesorios-de-celular.webp',
    carouselSrc: '/hero-carousel/accesorios-de-celular.webp',
    defaults: {
      templateId: 'accesorios-de-celular',
      primary: '#0284c7',
      accent: '#6366f1',
      background: 'light',
    },
  },
  {
    id: 'producto-regional',
    name: 'Producto regional',
    description: 'Sabores de Mendoza',
    bannerSrc: '/store-templates/producto-regional.webp',
    carouselSrc: '/hero-carousel/producto-regional.webp',
    defaults: {
      templateId: 'producto-regional',
      primary: '#b91c1c',
      accent: '#f59e0b',
      background: 'light',
    },
  },
  {
    id: 'mendoza-independencia',
    name: 'Mendoza independencia',
    description: 'Identidad local',
    bannerSrc: '/store-templates/mendoza-independencia.webp',
    carouselSrc: '/hero-carousel/mendoza-independencia.webp',
    defaults: {
      templateId: 'mendoza-independencia',
      primary: '#7f1d1d',
      accent: '#fbbf24',
      background: 'light',
    },
  },
  {
    id: 'parque-central',
    name: 'Parque central',
    description: 'Estilo Mendoza urbano',
    bannerSrc: '/store-templates/parque-central.webp',
    carouselSrc: '/hero-carousel/parque-central.webp',
    defaults: {
      templateId: 'parque-central',
      primary: '#166534',
      accent: '#38bdf8',
      background: 'light',
    },
  },
  {
    id: 'flores-de-limpiapipas',
    name: 'Flores de limpiapipas',
    description: 'Artesanías y manualidades',
    bannerSrc: '/store-templates/flores-de-limpiapipas.webp',
    carouselSrc: '/hero-carousel/flores-de-limpiapipas.webp',
    defaults: {
      templateId: 'flores-de-limpiapipas',
      primary: '#a855f7',
      accent: '#f43f5e',
      background: 'light',
    },
  },
]

export const HERO_CAROUSEL_SLIDES = STORE_TEMPLATES.map((t) => ({
  src: t.carouselSrc,
  alt: `Mendoshop — ${t.name}`,
}))

const byId = new Map(STORE_TEMPLATES.map((t) => [t.id, t]))

export function getStoreTemplate(templateId: string): StoreTemplate | undefined {
  return byId.get(templateId)
}

export function getStoreTemplateOrDefault(templateId: string): StoreTemplate {
  return byId.get(templateId) ?? STORE_TEMPLATES[0]!
}

/** Banner de plantilla o null si es tema legacy sin imagen. */
export function templateBannerSrc(templateId: string): string | null {
  return byId.get(templateId)?.bannerSrc ?? null
}
