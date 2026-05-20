/** Generado por npm run templates:sync — no editar a mano. */
import type { ShopTheme } from '@/types/shop'

export type StoreTemplate = {
  id: string
  name: string
  description: string
  bannerSrc: string
  carouselSrc: string
  defaults: ShopTheme
}

export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    "id": "accesorios-de-celular",
    "name": "Accesorios de celular",
    "description": "Fundas, cables y más",
    "bannerSrc": "/store-templates/accesorios-de-celular-1.webp",
    "carouselSrc": "/hero-carousel-2x/accesorios-de-celular-1.webp",
    "defaults": {
      "templateId": "accesorios-de-celular",
      "primary": "#ff630a",
      "accent": "#048b75",
      "productFrame": "#ebcfcd",
      "background": "light",
      "backgroundColors": {
        "light": "#ebebeb"
      }
    }
  },
  {
    "id": "alimento-de-mascota",
    "name": "Alimento de mascota",
    "description": "Alimentos y snacks",
    "bannerSrc": "/store-templates/alimento-de-mascota-1.webp",
    "carouselSrc": "/hero-carousel-2x/alimento-de-mascota-1.webp",
    "defaults": {
      "templateId": "alimento-de-mascota",
      "primary": "#c58500",
      "accent": "#04788b",
      "productFrame": "#b4b4b4",
      "background": "solid",
      "backgroundColors": {
        "solid": "#08080a"
      }
    }
  },
  {
    "id": "bijuteria",
    "name": "Bijuteria",
    "description": "Joyas y accesorios",
    "bannerSrc": "/store-templates/bijuteria-1.webp",
    "carouselSrc": "/hero-carousel-2x/bijuteria-1.webp",
    "defaults": {
      "templateId": "bijuteria",
      "primary": "#886f2a",
      "accent": "#2c96af",
      "productFrame": "#f4f4f5",
      "background": "light",
      "backgroundColors": {
        "light": "#ebebeb"
      }
    }
  },
  {
    "id": "deportivos",
    "name": "Deportivos",
    "description": "Artículos deportivos",
    "bannerSrc": "/store-templates/deportivos-1.webp",
    "carouselSrc": "/hero-carousel-2x/deportivos-1.webp",
    "defaults": {
      "templateId": "deportivos",
      "primary": "#8B5E3C",
      "accent": "#1e4d6b",
      "productFrame": "#ffffff",
      "background": "light",
      "backgroundColors": {
        "light": "#f8f6f3"
      }
    }
  },
  {
    "id": "flores-de-limpiapipas",
    "name": "Flores de limpiapipas",
    "description": "Artesanías y manualidades",
    "bannerSrc": "/store-templates/flores-de-limpiapipas-1.webp",
    "carouselSrc": "/hero-carousel-2x/flores-de-limpiapipas-1.webp",
    "defaults": {
      "templateId": "flores-de-limpiapipas",
      "primary": "#3974d1",
      "accent": "#84140b",
      "productFrame": "#b4b4ce",
      "background": "pattern",
      "backgroundColors": {
        "patternBase": "#14141b",
        "patternDot": "#3974d1"
      }
    }
  },
  {
    "id": "manicura",
    "name": "Manicura",
    "description": "Belleza y uñas",
    "bannerSrc": "/store-templates/manicura-1.webp",
    "carouselSrc": "/hero-carousel-2x/manicura-1.webp",
    "defaults": {
      "templateId": "manicura",
      "primary": "#bf7a4a",
      "accent": "#147b6d",
      "productFrame": "#b4b4b4",
      "background": "gradient",
      "backgroundColors": {
        "gradientTop": "#bf7a4a",
        "gradientBottom": "#060808"
      }
    }
  },
  {
    "id": "plantas",
    "name": "Plantas",
    "description": "Verde y naturaleza",
    "bannerSrc": "/store-templates/plantas-1.webp",
    "carouselSrc": "/hero-carousel-2x/plantas-1.webp",
    "defaults": {
      "templateId": "plantas",
      "primary": "#67a700",
      "accent": "#0a27c5",
      "productFrame": "#b4b4b4",
      "background": "pattern",
      "backgroundColors": {
        "patternBase": "#151516",
        "patternDot": "#67a700"
      }
    }
  },
  {
    "id": "ropa",
    "name": "Ropa",
    "description": "Indumentaria y moda",
    "bannerSrc": "/store-templates/ropa-1.webp",
    "carouselSrc": "/hero-carousel-2x/ropa-1.webp",
    "defaults": {
      "templateId": "ropa",
      "primary": "#ff0a53",
      "accent": "#048b1a",
      "productFrame": "#f4f4f5",
      "background": "light",
      "backgroundColors": {
        "light": "#ebebeb"
      }
    }
  }
]

export const RUBRO_PRESET_OPTIONS = [
  "Accesorios de celular",
  "Alimento de mascota",
  "Bijuteria",
  "Deportivos",
  "Flores de limpiapipas",
  "Manicura",
  "Plantas",
  "Ropa"
] as const
